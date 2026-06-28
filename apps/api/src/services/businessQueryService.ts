import { randomUUID } from "node:crypto";
import {
  createBossEvent,
  InMemoryEventBus,
  type EventBus,
  type EventContext,
} from "@boss/events";
import { businessQueryRegistry } from "@boss/registries";
import type {
  BqilPerformance,
  BusinessInsight,
  BusinessProjection,
  BusinessProjectionItem,
  BusinessQuery,
  BusinessQueryId,
  BusinessView,
  QueryDefinition,
  QueryExecution,
  QueryResult,
  SemanticEntity,
  SemanticRelationship,
  SemanticSnapshot,
} from "@boss/types";
import {
  createAuditEvent,
  InMemoryAuditSink,
  type AuditSink,
} from "../observability.js";
import type {
  BusinessSemanticLayer,
  SemanticLoadRequest,
} from "./businessSemanticLayer.js";

export interface BusinessQueryRequest extends BusinessQuery {
  readonly execution: EventContext;
}

export interface BusinessQueryService {
  execute(request: BusinessQueryRequest): Promise<QueryResult>;
  stream(
    request: BusinessQueryRequest,
  ): AsyncIterable<BusinessProjectionItem>;
  catalog(): readonly QueryDefinition[];
  performance(): BqilPerformance;
}

interface QueryArtifact {
  readonly definition: QueryDefinition;
  readonly view: BusinessView;
  readonly insights: readonly BusinessInsight[];
  readonly projectionDurationMs: number;
}

interface PerformanceCounters {
  executions: number;
  cacheHits: number;
  cacheMisses: number;
  totalLatencyMs: number;
  totalProjectionMs: number;
}

function semanticRequest(request: BusinessQueryRequest): SemanticLoadRequest {
  return {
    orgId: request.orgId,
    businessId: request.businessId,
    execution: request.execution,
    ...(request.graphVersion !== undefined
      ? { graphVersion: request.graphVersion }
      : {}),
  };
}

function publicDefinition(queryId: BusinessQueryId): QueryDefinition {
  const entry = businessQueryRegistry.get(queryId);
  if (!entry || entry.status !== "active") {
    throw new Error(`Business query "${queryId}" is not registered.`);
  }
  return Object.freeze({
    id: entry.id,
    displayName: entry.displayName,
    description: entry.description,
    category: entry.category,
    projectionKind: entry.projectionKind,
    ...(entry.semanticViewId
      ? { semanticViewId: entry.semanticViewId }
      : {}),
    entityTypes: entry.entityTypes,
    relationshipTypes: entry.relationshipTypes,
    version: entry.version,
    status: entry.status,
  });
}

function stableParameters(
  parameters: BusinessQuery["parameters"],
): string {
  if (!parameters) return "";
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(parameters).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
  );
}

function cacheKey(
  request: BusinessQueryRequest,
  semanticVersion: number,
): string {
  return [
    request.orgId,
    request.businessId,
    semanticVersion,
    request.queryId,
    request.cursor ?? "0",
    request.limit ?? 50,
    stableParameters(request.parameters),
  ].join(":");
}

export class BusinessQueryCache {
  private readonly queries = new Map<string, QueryArtifact>();
  private readonly projections = new Map<string, BusinessProjection>();
  private readonly contexts = new Map<string, SemanticSnapshot>();

  getQuery(key: string): QueryArtifact | undefined {
    return this.queries.get(key);
  }

  setQuery(key: string, artifact: QueryArtifact): void {
    this.queries.set(key, artifact);
  }

  getProjection(key: string): BusinessProjection | undefined {
    return this.projections.get(key);
  }

  setProjection(key: string, projection: BusinessProjection): void {
    this.projections.set(key, projection);
  }

  setContext(snapshot: SemanticSnapshot): void {
    this.contexts.set(
      `${snapshot.context.orgId}:${snapshot.context.businessId}:${snapshot.context.semanticVersion}`,
      snapshot,
    );
  }

  getContext(
    orgId: string,
    businessId: string,
    semanticVersion: number,
  ): SemanticSnapshot | undefined {
    return this.contexts.get(
      `${orgId}:${businessId}:${semanticVersion}`,
    );
  }

  invalidate(orgId: string, businessId: string): void {
    const prefix = `${orgId}:${businessId}:`;
    for (const key of this.queries.keys()) {
      if (key.startsWith(prefix)) this.queries.delete(key);
    }
    for (const key of this.projections.keys()) {
      if (key.startsWith(prefix)) this.projections.delete(key);
    }
    for (const key of this.contexts.keys()) {
      if (key.startsWith(prefix)) this.contexts.delete(key);
    }
  }

  size(): {
    readonly queries: number;
    readonly projections: number;
    readonly contexts: number;
  } {
    return Object.freeze({
      queries: this.queries.size,
      projections: this.projections.size,
      contexts: this.contexts.size,
    });
  }
}

function entityItem(entity: SemanticEntity): BusinessProjectionItem {
  return Object.freeze({
    id: entity.id,
    kind: "entity",
    data: Object.freeze({
      type: entity.type,
      displayName: entity.displayName,
      ...(entity.externalRef ? { externalRef: entity.externalRef } : {}),
      ...(entity.owner ? { owner: entity.owner } : {}),
      attributes: entity.attributes,
    }),
    evidenceRefs: Object.freeze([entity.id]),
  });
}

function relationshipItem(
  relationship: SemanticRelationship,
): BusinessProjectionItem {
  return Object.freeze({
    id: relationship.id,
    kind: "relationship",
    data: Object.freeze({
      type: relationship.type,
      sourceEntityId: relationship.sourceEntityId,
      targetEntityId: relationship.targetEntityId,
      attributes: relationship.attributes,
    }),
    evidenceRefs: Object.freeze([
      relationship.id,
      relationship.sourceEntityId,
      relationship.targetEntityId,
    ]),
  });
}

function page(
  items: readonly BusinessProjectionItem[],
  cursor: string | undefined,
  requestedLimit: number | undefined,
): {
  readonly items: readonly BusinessProjectionItem[];
  readonly cursor: string | null;
  readonly nextCursor: string | null;
} {
  const offset = cursor === undefined ? 0 : Number.parseInt(cursor, 10);
  if (!Number.isSafeInteger(offset) || offset < 0) {
    throw new Error("Business query cursor must be a non-negative integer.");
  }
  const limit = Math.min(100, Math.max(1, requestedLimit ?? 50));
  const selected = Object.freeze(items.slice(offset, offset + limit));
  const nextOffset = offset + selected.length;
  return Object.freeze({
    items: selected,
    cursor: offset === 0 ? null : String(offset),
    nextCursor: nextOffset < items.length ? String(nextOffset) : null,
  });
}

function projectionTimestamp(item: BusinessProjectionItem): string {
  const attributes = item.data.attributes;
  if (
    typeof attributes === "object" &&
    attributes !== null &&
    "timestamp" in attributes &&
    typeof attributes.timestamp === "string"
  ) {
    return attributes.timestamp;
  }
  return "";
}

export class ProjectionEngine {
  generate(
    request: BusinessQuery,
    definition: QueryDefinition,
    semantic: SemanticSnapshot,
  ): BusinessProjection {
    const allowedEntityTypes = new Set(definition.entityTypes);
    const entities = semantic.context.entities.filter((entity) =>
      allowedEntityTypes.has(entity.type),
    );
    const entityIds = new Set(entities.map((entity) => entity.id));
    const allowedRelationships = new Set(definition.relationshipTypes);
    const relationships = semantic.context.relationships.filter(
      (relationship) =>
        allowedRelationships.has(relationship.type) &&
        (entityIds.has(relationship.sourceEntityId) ||
          entityIds.has(relationship.targetEntityId)),
    );

    let items: readonly BusinessProjectionItem[];
    if (definition.projectionKind === "relationship") {
      items = relationships.map(relationshipItem);
    } else if (
      definition.projectionKind === "aggregate" ||
      definition.projectionKind === "context"
    ) {
      const counts: Record<string, number> = {};
      for (const entity of entities) {
        counts[entity.type] = (counts[entity.type] ?? 0) + 1;
      }
      items = Object.freeze([
        Object.freeze({
          id: `${semantic.context.id}:aggregate:${definition.id}`,
          kind: "aggregate" as const,
          data: Object.freeze({
            entityCounts: Object.freeze(counts),
            relationshipCount: relationships.length,
            lifecycle: semantic.context.lifecycle,
          }),
          evidenceRefs: Object.freeze([
            ...entities.map((entity) => entity.id),
            ...relationships.map((relationship) => relationship.id),
          ]),
        }),
        ...entities.map(entityItem),
      ]);
    } else {
      items = entities.map(entityItem);
    }

    const ordered = Object.freeze(
      [...items].sort((left, right) => {
        if (definition.projectionKind === "timeline") {
          const byTimestamp = projectionTimestamp(left).localeCompare(
            projectionTimestamp(right),
          );
          if (byTimestamp !== 0) return byTimestamp;
        }
        return left.id.localeCompare(right.id);
      }),
    );
    const selected = page(ordered, request.cursor, request.limit);
    return Object.freeze({
      id: `${semantic.context.id}:projection:${definition.id}:${selected.cursor ?? "0"}`,
      queryId: definition.id,
      kind: definition.projectionKind,
      items: selected.items,
      totalCount: ordered.length,
      cursor: selected.cursor,
      nextCursor: selected.nextCursor,
      generatedAt: new Date().toISOString(),
    });
  }
}

export class BusinessInsightService {
  generate(
    definition: QueryDefinition,
    semantic: SemanticSnapshot,
    projection: BusinessProjection,
  ): readonly BusinessInsight[] {
    const generatedAt = new Date().toISOString();
    const entities = semantic.context.entities.filter((entity) =>
      definition.entityTypes.includes(entity.type),
    );
    const relationships = semantic.context.relationships.filter(
      (relationship) =>
        definition.relationshipTypes.includes(relationship.type) &&
        entities.some(
          (entity) =>
            entity.id === relationship.sourceEntityId ||
            entity.id === relationship.targetEntityId,
        ),
    );
    const missing = definition.entityTypes.filter(
      (type) => !entities.some((entity) => entity.type === type),
    );
    const expected = new Set(definition.entityTypes).size;
    const present = expected - new Set(missing).size;
    const completeness =
      expected === 0 ? 100 : Math.round((present / expected) * 100);
    const evidence = Object.freeze(
      projection.items.flatMap((item) => item.evidenceRefs),
    );
    const insights: BusinessInsight[] = [
      {
        id: `${projection.id}:insight:entity-count`,
        type: "entity_count",
        statement: `${entities.length} matching entities are present.`,
        value: entities.length,
        evidenceRefs: Object.freeze(entities.map((entity) => entity.id)),
        generatedAt,
      },
      {
        id: `${projection.id}:insight:relationship-total`,
        type: "relationship_total",
        statement: `${relationships.length} matching relationships are present.`,
        value: relationships.length,
        evidenceRefs: Object.freeze(
          relationships.map((relationship) => relationship.id),
        ),
        generatedAt,
      },
      {
        id: `${projection.id}:insight:missing-information`,
        type: "missing_information",
        statement:
          missing.length === 0
            ? "All query entity categories are represented."
            : `${missing.length} query entity categories are not represented.`,
        value: Object.freeze([...missing]),
        evidenceRefs: evidence,
        generatedAt,
      },
      {
        id: `${projection.id}:insight:lifecycle`,
        type: "lifecycle_state",
        statement: `Semantic Context lifecycle is ${semantic.context.lifecycle}.`,
        value: semantic.context.lifecycle,
        evidenceRefs: Object.freeze([semantic.context.id]),
        generatedAt,
      },
      {
        id: `${projection.id}:insight:completeness`,
        type: "context_completeness",
        statement: `${completeness}% of query entity categories are represented.`,
        value: completeness,
        evidenceRefs: evidence,
        generatedAt,
      },
    ];
    if (definition.id === "execution_context") {
      const executionCount = entities.filter((entity) =>
        ["workflow", "automation", "ai_agent"].includes(entity.type),
      ).length;
      insights.push({
        id: `${projection.id}:insight:execution-statistic`,
        type: "execution_statistic",
        statement: `${executionCount} execution entities are registered in context.`,
        value: executionCount,
        evidenceRefs: Object.freeze(
          entities
            .filter((entity) =>
              ["workflow", "automation", "ai_agent"].includes(entity.type),
            )
            .map((entity) => entity.id),
        ),
        generatedAt,
      });
    }
    return Object.freeze(insights.map((insight) => Object.freeze(insight)));
  }
}

function eventPayload(
  request: BusinessQueryRequest,
  result: Pick<QueryResult, "definition" | "view">,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    tenantId: request.orgId,
    organizationId: request.orgId,
    businessId: request.businessId,
    queryId: result.definition.id,
    semanticVersion: result.view.semanticVersion,
    graphVersion: result.view.graphVersion,
    correlationId: request.execution.correlationId,
    traceId: request.execution.traceId,
    timestamp: new Date().toISOString(),
  });
}

export function createBusinessQueryService(
  semantics: BusinessSemanticLayer,
  events: EventBus = new InMemoryEventBus(),
  audit: AuditSink = new InMemoryAuditSink(),
  cache: BusinessQueryCache = new BusinessQueryCache(),
  projections: ProjectionEngine = new ProjectionEngine(),
  insights: BusinessInsightService = new BusinessInsightService(),
): BusinessQueryService {
  const counters: PerformanceCounters = {
    executions: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalLatencyMs: 0,
    totalProjectionMs: 0,
  };

  events.subscribe<Record<string, unknown>>(
    "business.semantic.updated",
    (event) => {
      const orgId = event.payload.tenantId;
      const businessId = event.payload.businessId;
      if (typeof orgId === "string" && typeof businessId === "string") {
        cache.invalidate(orgId, businessId);
      }
    },
  );

  const emit = async (
    type: string,
    request: BusinessQueryRequest,
    artifact: Pick<QueryArtifact, "definition" | "view">,
    extra: Readonly<Record<string, unknown>> = {},
  ): Promise<void> => {
    await events.publish(
      createBossEvent(
        type,
        { ...eventPayload(request, artifact), ...extra },
        request.execution,
      ),
    );
  };

  const execute = async (
    request: BusinessQueryRequest,
  ): Promise<QueryResult> => {
    const startedAt = performance.now();
    if (request.execution.orgId !== request.orgId) {
      throw new Error("Business query tenant does not match execution context.");
    }
    const definition = publicDefinition(request.queryId);
    const resolvedSemantic = await semantics.load(semanticRequest(request));
    const semantic =
      cache.getContext(
        request.orgId,
        request.businessId,
        resolvedSemantic.context.semanticVersion,
      ) ?? resolvedSemantic;
    if (semantic === resolvedSemantic) cache.setContext(semantic);
    const key = cacheKey(request, semantic.context.semanticVersion);
    let artifact = cache.getQuery(key);
    const cacheHit = artifact !== undefined;
    if (artifact) {
      counters.cacheHits += 1;
    } else {
      counters.cacheMisses += 1;
      const projectionStartedAt = performance.now();
      let projection = cache.getProjection(key);
      if (!projection) {
        projection = projections.generate(request, definition, semantic);
        cache.setProjection(key, projection);
      }
      const projectionDurationMs = Math.max(
        0,
        performance.now() - projectionStartedAt,
      );
      const view: BusinessView = Object.freeze({
        id: `${semantic.context.id}:query-view:${definition.id}`,
        queryId: definition.id,
        displayName: definition.displayName,
        semanticVersion: semantic.context.semanticVersion,
        graphVersion: semantic.context.graphVersion,
        lifecycle: semantic.context.lifecycle,
        projections: Object.freeze([projection]),
        generatedAt: new Date().toISOString(),
      });
      artifact = Object.freeze({
        definition,
        view,
        insights: insights.generate(definition, semantic, projection),
        projectionDurationMs,
      });
      cache.setQuery(key, artifact);
      await emit("business.projection.generated", request, artifact, {
        projectionId: projection.id,
        projectionKind: projection.kind,
      });
      await emit("business.view.generated", request, artifact, {
        viewId: view.id,
      });
      await emit("business.insight.generated", request, artifact, {
        insightCount: artifact.insights.length,
      });
    }

    const durationMs = Math.max(0, performance.now() - startedAt);
    const execution: QueryExecution = Object.freeze({
      id: randomUUID(),
      queryId: definition.id,
      queryVersion: definition.version,
      semanticVersion: artifact.view.semanticVersion,
      graphVersion: artifact.view.graphVersion,
      discoveryVersion: semantic.context.discoveryVersion,
      cacheHit,
      durationMs,
      projectionDurationMs: cacheHit ? 0 : artifact.projectionDurationMs,
      executedAt: new Date().toISOString(),
    });
    const result: QueryResult = Object.freeze({
      query: Object.freeze({
        queryId: request.queryId,
        orgId: request.orgId,
        businessId: request.businessId,
        ...(request.graphVersion !== undefined
          ? { graphVersion: request.graphVersion }
          : {}),
        ...(request.cursor !== undefined ? { cursor: request.cursor } : {}),
        ...(request.limit !== undefined ? { limit: request.limit } : {}),
        ...(request.parameters
          ? { parameters: Object.freeze({ ...request.parameters }) }
          : {}),
      }),
      definition: artifact.definition,
      view: artifact.view,
      insights: artifact.insights,
      execution,
    });
    counters.executions += 1;
    counters.totalLatencyMs += durationMs;
    counters.totalProjectionMs += execution.projectionDurationMs;
    await emit("business.query.executed", request, artifact, {
      executionId: execution.id,
      cacheHit,
      durationMs,
    });
    await audit.record(
      createAuditEvent({
        traceId: request.execution.traceId,
        orgId: request.orgId,
        actorId: request.execution.actorId,
        action: "business.query.executed",
        resourceType: "business_query",
        resourceId: execution.id,
        outcome: "success",
        metadata: {
          requestId: request.execution.requestId,
          correlationId: request.execution.correlationId,
          businessId: request.businessId,
          queryId: definition.id,
          queryVersion: definition.version,
          semanticVersion: execution.semanticVersion,
          graphVersion: execution.graphVersion,
          cacheHit,
          durationMs,
        },
      }),
    );
    return result;
  };

  return {
    execute,

    async *stream(request) {
      const result = await execute(request);
      for (const projection of result.view.projections) {
        for (const item of projection.items) {
          yield item;
        }
      }
    },

    catalog: () =>
      Object.freeze(
        businessQueryRegistry
          .list()
          .filter((entry) => entry.status === "active")
          .map((entry) => publicDefinition(entry.id)),
      ),

    performance: () => {
      const sizes = cache.size();
      return Object.freeze({
        executions: counters.executions,
        cacheHits: counters.cacheHits,
        cacheMisses: counters.cacheMisses,
        cacheHitRatio:
          counters.executions === 0
            ? 0
            : counters.cacheHits / counters.executions,
        averageQueryLatencyMs:
          counters.executions === 0
            ? 0
            : counters.totalLatencyMs / counters.executions,
        averageProjectionGenerationMs:
          counters.cacheMisses === 0
            ? 0
            : counters.totalProjectionMs / counters.cacheMisses,
        queryCacheEntries: sizes.queries,
        projectionCacheEntries: sizes.projections,
        contextCacheEntries: sizes.contexts,
      });
    },
  };
}
