import {
  createBossEvent,
  InMemoryEventBus,
  type EventBus,
  type EventContext,
} from "@boss/events";
import { semanticViewRegistry } from "@boss/registries";
import type {
  BusinessContextSnapshot,
  BusinessNode,
  BusinessSemanticContext,
  SemanticDependencyResolution,
  SemanticEntity,
  SemanticEntityType,
  SemanticProjection,
  SemanticRelationship,
  SemanticSnapshot,
  SemanticView,
  SemanticViewId,
} from "@boss/types";
import {
  createAuditEvent,
  InMemoryAuditSink,
  type AuditSink,
} from "../observability.js";
import type { BusinessContextService } from "./businessContextService.js";
import type {
  GraphRuntime,
  GraphSession,
} from "./businessGraphRuntime.js";

const SCHEMA_VERSION = "1.0.0";
const SEMANTIC_PREFIX = "semantic:";

export type SemanticDependencyKind =
  | "ownership"
  | "responsibility"
  | "operational_dependencies"
  | "business_dependencies"
  | "policy_scope"
  | "execution_scope";

export interface SemanticLoadRequest {
  readonly orgId: string;
  readonly businessId: string;
  readonly execution: EventContext;
  readonly graphVersion?: number;
}

export interface BusinessSemanticLayer {
  load(request: SemanticLoadRequest): Promise<SemanticSnapshot>;
  resolveEntities(
    request: SemanticLoadRequest,
    types: readonly SemanticEntityType[],
    scope: string,
  ): Promise<readonly SemanticEntity[]>;
  createView(
    request: SemanticLoadRequest,
    viewId: SemanticViewId,
  ): Promise<SemanticView>;
  resolveDependencies(
    request: SemanticLoadRequest,
    entityId: string,
    kind: SemanticDependencyKind,
  ): Promise<SemanticDependencyResolution>;
  cacheHealth(): {
    readonly contexts: number;
    readonly views: number;
  };
}

function semanticEntityId(nodeId: string): string {
  return `${SEMANTIC_PREFIX}${nodeId}`;
}

function graphNodeId(entityId: string): string {
  if (!entityId.startsWith(SEMANTIC_PREFIX)) {
    throw new Error(`Semantic entity "${entityId}" is not a canonical ID.`);
  }
  return entityId.slice(SEMANTIC_PREFIX.length);
}

function semanticRelationshipId(edgeId: string): string {
  return `${SEMANTIC_PREFIX}${edgeId}`;
}

function contextKey(
  orgId: string,
  businessId: string,
  graphVersion: number,
): string {
  return `${orgId}:${businessId}:${graphVersion}`;
}

function viewKey(
  orgId: string,
  businessId: string,
  graphVersion: number,
  viewId: SemanticViewId,
): string {
  return `${contextKey(orgId, businessId, graphVersion)}:${viewId}`;
}

export class SemanticCache {
  private readonly contexts = new Map<string, SemanticSnapshot>();
  private readonly views = new Map<string, SemanticView>();

  getContext(
    orgId: string,
    businessId: string,
    graphVersion: number,
  ): SemanticSnapshot | undefined {
    return this.contexts.get(contextKey(orgId, businessId, graphVersion));
  }

  setContext(snapshot: SemanticSnapshot): void {
    const context = snapshot.context;
    this.contexts.set(
      contextKey(context.orgId, context.businessId, context.graphVersion),
      snapshot,
    );
  }

  getView(
    orgId: string,
    businessId: string,
    graphVersion: number,
    viewId: SemanticViewId,
  ): SemanticView | undefined {
    return this.views.get(viewKey(orgId, businessId, graphVersion, viewId));
  }

  setView(
    orgId: string,
    businessId: string,
    view: SemanticView,
  ): void {
    this.views.set(
      viewKey(orgId, businessId, view.graphVersion, view.viewId),
      view,
    );
  }

  invalidate(orgId: string, businessId: string): void {
    const prefix = `${orgId}:${businessId}:`;
    for (const key of this.contexts.keys()) {
      if (key.startsWith(prefix)) this.contexts.delete(key);
    }
    for (const key of this.views.keys()) {
      if (key.startsWith(prefix)) this.views.delete(key);
    }
  }

  size(): { readonly contexts: number; readonly views: number } {
    return Object.freeze({
      contexts: this.contexts.size,
      views: this.views.size,
    });
  }
}

function toEntity(
  node: BusinessNode,
  businessContext: BusinessContextSnapshot,
): SemanticEntity {
  const contextAttributes =
    node.type === "organization"
      ? {
          industry: businessContext.context.organizationProfile.industry,
          businessModel:
            businessContext.context.organizationProfile.businessModel,
          locations: businessContext.context.organizationProfile.locations,
        }
      : {};
  return Object.freeze({
    id: semanticEntityId(node.id),
    type: node.type,
    displayName: node.label,
    ...(node.externalRef ? { externalRef: node.externalRef } : {}),
    ...(node.metadata.owner ? { owner: node.metadata.owner } : {}),
    attributes: Object.freeze({
      ...node.metadata.extensions,
      ...contextAttributes,
    }),
  });
}

function toRelationship(
  edge: GraphSession["context"]["snapshot"]["edges"][number],
): SemanticRelationship {
  return Object.freeze({
    id: semanticRelationshipId(edge.id),
    sourceEntityId: semanticEntityId(edge.sourceNodeId),
    targetEntityId: semanticEntityId(edge.targetNodeId),
    type: edge.relationship,
    attributes: Object.freeze({ ...edge.metadata.extensions }),
  });
}

function projectView(
  context: BusinessSemanticContext,
  projection: SemanticProjection,
): SemanticView {
  const allowedTypes = new Set(projection.entityTypes);
  const entities = Object.freeze(
    context.entities.filter((entity) => allowedTypes.has(entity.type)),
  );
  const entityIds = new Set(entities.map((entity) => entity.id));
  const allowedRelationships = new Set(projection.relationshipTypes);
  const relationships = Object.freeze(
    context.relationships.filter(
      (relationship) =>
        entityIds.has(relationship.sourceEntityId) &&
        entityIds.has(relationship.targetEntityId) &&
        allowedRelationships.has(relationship.type),
    ),
  );
  const entityCounts: Record<string, number> = {};
  for (const entity of entities) {
    entityCounts[entity.type] = (entityCounts[entity.type] ?? 0) + 1;
  }
  return Object.freeze({
    id: `${context.id}:view:${projection.id}`,
    viewId: projection.id,
    displayName: projection.displayName,
    semanticVersion: context.semanticVersion,
    graphVersion: context.graphVersion,
    entities,
    relationships,
    entityCounts: Object.freeze(entityCounts),
    generatedAt: new Date().toISOString(),
  });
}

function eventPayload(
  context: BusinessSemanticContext,
  execution: EventContext,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    tenantId: context.orgId,
    organizationId: context.orgId,
    businessId: context.businessId,
    semanticVersion: context.semanticVersion,
    graphVersion: context.graphVersion,
    correlationId: execution.correlationId,
    traceId: execution.traceId,
    timestamp: new Date().toISOString(),
  });
}

export function createBusinessSemanticLayer(
  graphs: GraphRuntime,
  contexts: BusinessContextService,
  events: EventBus = new InMemoryEventBus(),
  audit: AuditSink = new InMemoryAuditSink(),
  cache: SemanticCache = new SemanticCache(),
): BusinessSemanticLayer {
  const publish = async (
    type: string,
    context: BusinessSemanticContext,
    execution: EventContext,
    extra: Readonly<Record<string, unknown>> = {},
  ): Promise<void> => {
    await events.publish(
      createBossEvent(
        type,
        { ...eventPayload(context, execution), ...extra },
        execution,
      ),
    );
  };
  const record = async (
    action: string,
    context: BusinessSemanticContext,
    execution: EventContext,
    metadata: Readonly<Record<string, unknown>> = {},
  ): Promise<void> => {
    await audit.record(
      createAuditEvent({
        traceId: execution.traceId,
        orgId: context.orgId,
        actorId: execution.actorId,
        action,
        resourceType: "business_semantic_context",
        resourceId: context.id,
        outcome: "success",
        metadata: {
          requestId: execution.requestId,
          correlationId: execution.correlationId,
          businessId: context.businessId,
          semanticVersion: context.semanticVersion,
          graphVersion: context.graphVersion,
          ...metadata,
        },
      }),
    );
  };

  events.subscribe<Record<string, unknown>>(
    "business.graph.versioned",
    async (event) => {
      const orgId = event.payload.tenantId;
      const businessId = event.payload.businessId;
      const graphVersion = event.payload.graphVersion;
      if (
        typeof orgId !== "string" ||
        typeof businessId !== "string" ||
        typeof graphVersion !== "number" ||
        !event.context
      ) {
        return;
      }
      cache.invalidate(orgId, businessId);
      await events.publish(
        createBossEvent(
          "business.semantic.updated",
          {
            tenantId: orgId,
            organizationId: orgId,
            businessId,
            semanticVersion: graphVersion,
            graphVersion,
            correlationId: event.context.correlationId,
            traceId: event.context.traceId,
            timestamp: new Date().toISOString(),
          },
          event.context,
        ),
      );
    },
  );

  const load = async (
    request: SemanticLoadRequest,
  ): Promise<SemanticSnapshot> => {
    if (request.execution.orgId !== request.orgId) {
      throw new Error(
        "Semantic Context tenant does not match execution context.",
      );
    }
    const session = await graphs.openSession({
      orgId: request.orgId,
      businessId: request.businessId,
      execution: request.execution,
      ...(request.graphVersion !== undefined
        ? { version: request.graphVersion }
        : {}),
      requirePublished: false,
    });
    try {
      if (session.context.snapshot.status === "draft") {
        throw new Error("Semantic Context requires a published graph version.");
      }
      const graphVersion = session.context.graphVersion;
      const cached = cache.getContext(
        request.orgId,
        request.businessId,
        graphVersion,
      );
      if (cached) {
        await publish(
          "business.semantic.loaded",
          cached.context,
          request.execution,
          { cacheHit: true },
        );
        return cached;
      }

      const currentContext = await contexts.getCurrent(
        request.orgId,
        request.businessId,
      );
      const businessContext =
        currentContext?.discoveryVersion ===
        session.context.snapshot.sourceDiscoveryVersion
          ? currentContext
          : (
              await contexts.listVersions(
                request.orgId,
                request.businessId,
              )
            ).find(
              (candidate) =>
                candidate.discoveryVersion ===
                session.context.snapshot.sourceDiscoveryVersion,
            );
      if (!businessContext) {
        throw new Error(
          "Semantic Context requires the Business Context version used by the graph.",
        );
      }

      const entities = Object.freeze(
        session.context.snapshot.nodes
          .map((node) => toEntity(node, businessContext))
          .sort((left, right) => left.id.localeCompare(right.id)),
      );
      const relationships = Object.freeze(
        session.context.snapshot.edges
          .map(toRelationship)
          .sort((left, right) => left.id.localeCompare(right.id)),
      );
      const organization = entities.find(
        (entity) => entity.type === "organization",
      );
      if (!organization) {
        throw new Error("Semantic Context requires an organization entity.");
      }
      const semanticContext: BusinessSemanticContext = Object.freeze({
        id: `semantic-context:${request.orgId}:${request.businessId}:${graphVersion}`,
        orgId: request.orgId,
        businessId: request.businessId,
        semanticVersion: graphVersion,
        graphVersion,
        discoveryVersion: businessContext.discoveryVersion,
        schemaVersion: SCHEMA_VERSION,
        lifecycle:
          session.context.snapshot.status === "archived"
            ? "archived"
            : request.graphVersion !== undefined
              ? "historical"
              : "active",
        organization,
        entities,
        relationships,
        generatedAt: new Date().toISOString(),
      });
      const projections = Object.freeze(
        semanticViewRegistry
          .list()
          .filter((entry) => entry.status === "active")
          .map(
            (entry): SemanticProjection =>
              Object.freeze({
                id: entry.id,
                displayName: entry.displayName,
                entityTypes: entry.entityTypes,
                relationshipTypes: entry.relationshipTypes,
                version: entry.version,
              }),
          ),
      );
      const snapshot = Object.freeze({
        context: semanticContext,
        projections,
      });
      cache.setContext(snapshot);
      await publish(
        "business.semantic.loaded",
        semanticContext,
        request.execution,
        { cacheHit: false },
      );
      await record(
        "business.semantic.loaded",
        semanticContext,
        request.execution,
      );
      return snapshot;
    } finally {
      graphs.closeSession(session.id);
    }
  };

  return {
    load,

    async resolveEntities(request, types, scope) {
      const snapshot = await load(request);
      const allowed = new Set(types);
      const entities = Object.freeze(
        snapshot.context.entities.filter((entity) =>
          allowed.has(entity.type),
        ),
      );
      await publish(
        "business.context.resolved",
        snapshot.context,
        request.execution,
        { scope, resultCount: entities.length },
      );
      await record(
        "business.context.resolved",
        snapshot.context,
        request.execution,
        { scope, resultCount: entities.length },
      );
      return entities;
    },

    async createView(request, viewId) {
      const snapshot = await load(request);
      const cached = cache.getView(
        request.orgId,
        request.businessId,
        snapshot.context.graphVersion,
        viewId,
      );
      if (cached) return cached;
      const projection = snapshot.projections.find(
        (candidate) => candidate.id === viewId,
      );
      if (!projection) {
        throw new Error(`Semantic view "${viewId}" is not registered.`);
      }
      const view = projectView(snapshot.context, projection);
      cache.setView(request.orgId, request.businessId, view);
      await publish(
        "business.semantic.view.created",
        snapshot.context,
        request.execution,
        { viewId },
      );
      await record(
        "business.semantic.view.created",
        snapshot.context,
        request.execution,
        { viewId },
      );
      return view;
    },

    async resolveDependencies(request, entityId, kind) {
      const snapshot = await load(request);
      const entity = snapshot.context.entities.find(
        (candidate) => candidate.id === entityId,
      );
      if (!entity) {
        throw new Error(`Semantic entity "${entityId}" was not found.`);
      }
      const session = await graphs.openSession({
        orgId: request.orgId,
        businessId: request.businessId,
        execution: request.execution,
        version: snapshot.context.graphVersion,
        requirePublished: false,
      });
      try {
        const nodeId = graphNodeId(entityId);
        let relatedNodes: readonly BusinessNode[];
        switch (kind) {
          case "ownership":
            relatedNodes = await session.traversal.ownership(nodeId);
            break;
          case "responsibility":
            relatedNodes = await session.traversal.related(
              nodeId,
              ["manages", "supports"],
              "incoming",
            );
            break;
          case "operational_dependencies":
          case "business_dependencies":
            relatedNodes = await session.traversal.dependencies(nodeId);
            break;
          case "policy_scope":
            relatedNodes = await session.traversal.related(
              nodeId,
              ["governed_by"],
              "outgoing",
            );
            break;
          case "execution_scope":
            relatedNodes = await session.traversal.related(
              nodeId,
              ["executes", "supports", "integrates_with"],
              "both",
            );
            break;
        }
        const relatedIds = new Set(
          relatedNodes.map((node) => semanticEntityId(node.id)),
        );
        const related = Object.freeze(
          snapshot.context.entities.filter((candidate) =>
            relatedIds.has(candidate.id),
          ),
        );
        const resolution = Object.freeze({
          entity,
          related,
          semanticVersion: snapshot.context.semanticVersion,
          graphVersion: snapshot.context.graphVersion,
        });
        await publish(
          "business.context.resolved",
          snapshot.context,
          request.execution,
          { entityId, resolutionKind: kind, resultCount: related.length },
        );
        return resolution;
      } finally {
        graphs.closeSession(session.id);
      }
    },

    cacheHealth: () => cache.size(),
  };
}

export class ContextResolutionService {
  constructor(private readonly semantics: BusinessSemanticLayer) {}

  resolveOrganization(
    request: SemanticLoadRequest,
  ): Promise<SemanticEntity | null> {
    return this.resolveOne(request, "organization");
  }

  resolveDepartments(
    request: SemanticLoadRequest,
  ): Promise<readonly SemanticEntity[]> {
    return this.resolveMany(request, "department");
  }

  resolveTeams(
    request: SemanticLoadRequest,
  ): Promise<readonly SemanticEntity[]> {
    return this.resolveMany(request, "team");
  }

  resolveCustomers(
    request: SemanticLoadRequest,
  ): Promise<readonly SemanticEntity[]> {
    return this.resolveMany(request, "customer");
  }

  resolveVendors(
    request: SemanticLoadRequest,
  ): Promise<readonly SemanticEntity[]> {
    return this.resolveMany(request, "vendor");
  }

  resolveProducts(
    request: SemanticLoadRequest,
  ): Promise<readonly SemanticEntity[]> {
    return this.resolveMany(request, "product");
  }

  resolveProjects(
    request: SemanticLoadRequest,
  ): Promise<readonly SemanticEntity[]> {
    return this.resolveMany(request, "project");
  }

  resolveWorkflows(
    request: SemanticLoadRequest,
  ): Promise<readonly SemanticEntity[]> {
    return this.resolveMany(request, "workflow");
  }

  resolveAutomations(
    request: SemanticLoadRequest,
  ): Promise<readonly SemanticEntity[]> {
    return this.resolveMany(request, "automation");
  }

  resolveAIExecution(
    request: SemanticLoadRequest,
  ): Promise<readonly SemanticEntity[]> {
    return this.resolveMany(request, "ai_agent");
  }

  resolveExecutiveContext(request: SemanticLoadRequest): Promise<SemanticView> {
    return this.semantics.createView(request, "executive");
  }

  private async resolveOne(
    request: SemanticLoadRequest,
    type: SemanticEntityType,
  ): Promise<SemanticEntity | null> {
    return (await this.resolveMany(request, type))[0] ?? null;
  }

  private async resolveMany(
    request: SemanticLoadRequest,
    type: SemanticEntityType,
  ): Promise<readonly SemanticEntity[]> {
    return this.semantics.resolveEntities(request, [type], type);
  }
}

export class DependencyResolutionService {
  constructor(private readonly semantics: BusinessSemanticLayer) {}

  resolve(
    request: SemanticLoadRequest,
    entityId: string,
    kind: SemanticDependencyKind,
  ): Promise<SemanticDependencyResolution> {
    return this.semantics.resolveDependencies(request, entityId, kind);
  }
}
