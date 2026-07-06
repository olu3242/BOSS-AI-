/**
 * Search Platform — canonical full-text + filter search for all BOSS entities.
 *
 * Architecture law: ONE search implementation. Every entity delegates here.
 * Never implement entity-specific search logic in controllers or services.
 *
 * Capabilities:
 *   - Multi-field text matching (case-insensitive substring)
 *   - Cursor-based pagination
 *   - Sort (any field, asc/desc)
 *   - Filter (equality, range, array membership)
 *   - Faceted counts
 *   - Saved searches
 *   - Telemetry (search.executed event)
 *   - Tenant-aware (orgId always required)
 */
import { randomUUID } from "node:crypto";
import { createBossEvent, type EventBus } from "@boss/events";

// ── Types ────────────────────────────────────────────────────────────────────

export type SearchOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains" | "startsWith";

export interface SearchFilter {
  field: string;
  operator: SearchOperator;
  value: unknown;
}

export type SortDirection = "asc" | "desc";

export interface SearchSort {
  field: string;
  direction: SortDirection;
}

export interface SearchQuery {
  orgId: string;
  businessId?: string;
  entity: string;
  q?: string;
  /** Fields to apply full-text match against. Defaults to all string fields. */
  searchFields?: string[];
  filters?: SearchFilter[];
  sort?: SearchSort[];
  /** Opaque cursor from previous page */
  cursor?: string;
  limit?: number;
}

export interface SearchFacet {
  field: string;
  values: Array<{ value: string; count: number }>;
}

export interface SearchResult<T> {
  hits: T[];
  total: number;
  cursor: string | null;
  facets: SearchFacet[];
  queryId: string;
  durationMs: number;
}

export interface SavedSearch {
  id: string;
  orgId: string;
  businessId?: string;
  entity: string;
  name: string;
  query: Omit<SearchQuery, "orgId" | "cursor">;
  createdBy: string;
  createdAt: string;
}

// ── Query Builder ────────────────────────────────────────────────────────────

function applyFilter<T extends Record<string, unknown>>(item: T, filter: SearchFilter): boolean {
  const val = item[filter.field];

  switch (filter.operator) {
    case "eq":   return val === filter.value;
    case "neq":  return val !== filter.value;
    case "gt":   return typeof val === "number" && typeof filter.value === "number" && val > filter.value;
    case "gte":  return typeof val === "number" && typeof filter.value === "number" && val >= filter.value;
    case "lt":   return typeof val === "number" && typeof filter.value === "number" && val < filter.value;
    case "lte":  return typeof val === "number" && typeof filter.value === "number" && val <= filter.value;
    case "in":   return Array.isArray(filter.value) && filter.value.includes(val);
    case "contains":
      return typeof val === "string" && typeof filter.value === "string" &&
             val.toLowerCase().includes((filter.value as string).toLowerCase());
    case "startsWith":
      return typeof val === "string" && typeof filter.value === "string" &&
             val.toLowerCase().startsWith((filter.value as string).toLowerCase());
    default:     return true;
  }
}

function applyTextMatch<T extends Record<string, unknown>>(item: T, q: string, fields: string[]): boolean {
  const needle = q.toLowerCase().trim();
  if (!needle) return true;
  return fields.some((f) => {
    const v = item[f];
    return typeof v === "string" && v.toLowerCase().includes(needle);
  });
}

function applySort<T extends Record<string, unknown>>(items: T[], sorts: SearchSort[]): T[] {
  if (sorts.length === 0) return items;
  return [...items].sort((a, b) => {
    for (const s of sorts) {
      const av = a[s.field];
      const bv = b[s.field];
      if (av === bv) continue;
      if (typeof av === "string" && typeof bv === "string") {
        const cmp = av.localeCompare(bv);
        return s.direction === "asc" ? cmp : -cmp;
      }
      if (typeof av === "number" && typeof bv === "number") {
        return s.direction === "asc" ? av - bv : bv - av;
      }
    }
    return 0;
  });
}

function buildFacets<T extends Record<string, unknown>>(items: T[], facetFields: string[]): SearchFacet[] {
  return facetFields.map((field) => {
    const counts = new Map<string, number>();
    for (const item of items) {
      const v = String(item[field] ?? "");
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    return {
      field,
      values: [...counts.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count),
    };
  });
}

// Encode/decode cursor: just a base64 of the last item's id
function encodeCursor(id: string): string {
  return Buffer.from(id).toString("base64");
}
function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, "base64").toString("utf8");
}

// ── Core search engine ───────────────────────────────────────────────────────

export interface SearchEngineOptions {
  facetFields?: string[];
  defaultSearchFields?: string[];
  defaultSort?: SearchSort[];
}

/**
 * Execute a search against an in-memory or pre-fetched dataset.
 * Called by every entity's search handler.
 */
export function executeSearch<T extends Record<string, unknown> & { id: string; deletedAt?: string | null }>(
  items: T[],
  query: SearchQuery,
  opts: SearchEngineOptions = {},
): Omit<SearchResult<T>, "queryId" | "durationMs"> {
  const limit = Math.min(query.limit ?? 20, 100);
  const { q, filters = [], sort = opts.defaultSort ?? [], searchFields = opts.defaultSearchFields ?? [] } = query;

  // 1. Exclude soft-deleted
  let pool = items.filter((i) => !i.deletedAt);

  // 2. Text match
  if (q?.trim()) {
    const fields = searchFields.length > 0
      ? searchFields
      : (Object.keys(pool[0] ?? {}).filter((k) => {
          const v = pool[0]?.[k];
          return typeof v === "string";
        }));
    pool = pool.filter((i) => applyTextMatch(i as Record<string, unknown>, q, fields));
  }

  // 3. Filters
  for (const f of filters) {
    pool = pool.filter((i) => applyFilter(i as Record<string, unknown>, f));
  }

  const total = pool.length;

  // 4. Facets (computed before pagination)
  const facets = buildFacets(pool as unknown as Record<string, unknown>[], opts.facetFields ?? []);

  // 5. Sort
  pool = applySort(pool as unknown as Record<string, unknown>[], sort) as T[];

  // 6. Cursor-based pagination
  if (query.cursor) {
    const afterId = decodeCursor(query.cursor);
    const idx = pool.findIndex((i) => i.id === afterId);
    if (idx !== -1) pool = pool.slice(idx + 1);
  }

  // 7. Limit
  const hits = pool.slice(0, limit);
  const cursor = hits.length === limit && pool.length > limit
    ? encodeCursor(hits[hits.length - 1]?.id ?? "")
    : null;

  return { hits, total, cursor, facets };
}

// ── SearchService ─────────────────────────────────────────────────────────────

export type EntityFetcher = (orgId: string, businessId: string) => Promise<Record<string, unknown>[]>;

export interface SearchService {
  /**
   * Register an entity type with a data fetcher.
   * Called once per entity at startup.
   */
  register(entity: string, fetcher: EntityFetcher, opts?: SearchEngineOptions): void;

  /** Execute a search query. */
  search<T extends Record<string, unknown>>(query: SearchQuery): Promise<SearchResult<T>>;

  /** Save a named search for later re-execution. */
  saveSearch(search: Omit<SavedSearch, "id" | "createdAt">): Promise<SavedSearch>;

  /** List saved searches for a business+entity. */
  listSavedSearches(orgId: string, businessId: string, entity: string): Promise<SavedSearch[]>;

  /** Re-execute a saved search. */
  runSavedSearch<T extends Record<string, unknown>>(savedSearchId: string, orgId: string, businessId: string, cursor?: string): Promise<SearchResult<T>>;

  /** List all registered entity types. */
  registeredEntities(): string[];
}

export function createSearchService(eventBus: EventBus): SearchService {
  const registry = new Map<string, { fetcher: EntityFetcher; opts: SearchEngineOptions }>();
  const savedSearches = new Map<string, SavedSearch>();

  return {
    register(entity, fetcher, opts = {}) {
      registry.set(entity, { fetcher, opts });
    },

    async search<T extends Record<string, unknown>>(query: SearchQuery): Promise<SearchResult<T>> {
      const start = Date.now();
      const queryId = randomUUID();

      const entry = registry.get(query.entity);
      if (!entry) throw new Error(`Unknown search entity: ${query.entity}`);

      const businessId = query.businessId ?? "";
      const raw = await entry.fetcher(query.orgId, businessId);

      const result = executeSearch(
        raw as Array<Record<string, unknown> & { id: string; deletedAt?: string | null }>,
        query,
        entry.opts,
      );

      const durationMs = Date.now() - start;

      await eventBus.publish(
        createBossEvent(
          "search.executed",
          {
            queryId,
            entity: query.entity,
            q: query.q ?? null,
            filters: query.filters ?? [],
            sort: query.sort ?? [],
            total: result.total,
            hits: result.hits.length,
            durationMs,
          },
          {
            orgId: query.orgId,
            businessId: query.businessId,
            actorId: "search-platform",
            requestId: queryId,
            correlationId: queryId,
            traceId: queryId,
          },
        ),
      );

      return { ...result, queryId, durationMs } as SearchResult<T>;
    },

    async saveSearch(input) {
      const saved: SavedSearch = {
        ...input,
        id: randomUUID(),
        createdAt: new Date().toISOString(),
      };
      savedSearches.set(saved.id, saved);

      await eventBus.publish(
        createBossEvent(
          "search.saved",
          { savedSearchId: saved.id, entity: saved.entity, name: saved.name },
          {
            orgId: input.orgId,
            businessId: input.businessId,
            actorId: input.createdBy,
            requestId: saved.id,
            correlationId: saved.id,
            traceId: saved.id,
          },
        ),
      );

      return saved;
    },

    async listSavedSearches(orgId, businessId, entity) {
      return [...savedSearches.values()].filter(
        (s) => s.orgId === orgId && s.businessId === businessId && s.entity === entity,
      );
    },

    async runSavedSearch<T extends Record<string, unknown>>(savedSearchId: string, orgId: string, businessId: string, cursor?: string) {
      const saved = savedSearches.get(savedSearchId);
      if (!saved) throw new Error(`Saved search ${savedSearchId} not found`);
      return this.search<T>({ ...saved.query, orgId, businessId, cursor });
    },

    registeredEntities() {
      return [...registry.keys()];
    },
  };
}
