import { randomUUID } from "node:crypto";
import {
  createBossEvent,
  InMemoryEventBus,
  type EventBus,
  type EventContext,
} from "@boss/events";
import { businessRelationshipRegistry } from "@boss/registries";
import type {
  BusinessEdge,
  BusinessNode,
  BusinessNodeType,
  BusinessRelationshipType,
  GraphSnapshot,
} from "@boss/types";
import type { BusinessGraphService } from "./businessGraphService.js";

export type GraphRuntimeState =
  | "stopped"
  | "starting"
  | "running"
  | "degraded"
  | "stopping";

export interface GraphRuntimeHealth {
  readonly state: GraphRuntimeState;
  readonly startedAt: string | null;
  readonly checkedAt: string;
  readonly activeSessions: number;
  readonly snapshotCacheEntries: number;
  readonly traversalCacheEntries: number;
  readonly loads: number;
  readonly traversals: number;
  readonly validations: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
}

export interface GraphContext {
  readonly orgId: string;
  readonly businessId: string;
  readonly graphId: string;
  readonly graphVersion: number;
  readonly snapshot: GraphSnapshot;
  readonly execution: EventContext;
}

export interface GraphSession {
  readonly id: string;
  readonly openedAt: string;
  readonly context: GraphContext;
  readonly resolver: GraphResolver;
  readonly traversal: GraphTraversalService;
}

export interface GraphImpactChain {
  readonly source: BusinessNode;
  readonly dependencies: readonly BusinessNode[];
  readonly dependents: readonly BusinessNode[];
}

export interface GraphValidationIssue {
  readonly code:
    | "orphan_node"
    | "circular_dependency"
    | "invalid_relationship"
    | "duplicate_edge"
    | "missing_owner"
    | "broken_reference";
  readonly severity: "error" | "warning";
  readonly entityId: string;
  readonly message: string;
}

export interface GraphValidationReport {
  readonly graphId: string;
  readonly graphVersion: number;
  readonly valid: boolean;
  readonly issues: readonly GraphValidationIssue[];
  readonly checkedAt: string;
}

interface GraphRuntimeCounters {
  loads: number;
  traversals: number;
  validations: number;
  cacheHits: number;
  cacheMisses: number;
}

function snapshotKey(
  orgId: string,
  businessId: string,
  version: number,
): string {
  return `${orgId}:${businessId}:${version}`;
}

function traversalKey(
  context: GraphContext,
  operation: string,
  nodeId: string,
): string {
  return `${snapshotKey(context.orgId, context.businessId, context.graphVersion)}:${operation}:${nodeId}`;
}

export class GraphCache {
  private readonly snapshots = new Map<string, GraphSnapshot>();
  private readonly traversals = new Map<string, readonly BusinessNode[]>();

  getSnapshot(
    orgId: string,
    businessId: string,
    version: number,
  ): GraphSnapshot | undefined {
    return this.snapshots.get(snapshotKey(orgId, businessId, version));
  }

  setSnapshot(snapshot: GraphSnapshot): void {
    this.snapshots.set(
      snapshotKey(snapshot.orgId, snapshot.businessId, snapshot.version),
      snapshot,
    );
  }

  getTraversal(key: string): readonly BusinessNode[] | undefined {
    return this.traversals.get(key);
  }

  setTraversal(key: string, nodes: readonly BusinessNode[]): void {
    this.traversals.set(key, Object.freeze([...nodes]));
  }

  invalidate(orgId: string, businessId: string): void {
    const prefix = `${orgId}:${businessId}:`;
    for (const key of this.snapshots.keys()) {
      if (key.startsWith(prefix)) this.snapshots.delete(key);
    }
    for (const key of this.traversals.keys()) {
      if (key.startsWith(prefix)) this.traversals.delete(key);
    }
  }

  clear(): void {
    this.snapshots.clear();
    this.traversals.clear();
  }

  size(): { readonly snapshots: number; readonly traversals: number } {
    return Object.freeze({
      snapshots: this.snapshots.size,
      traversals: this.traversals.size,
    });
  }
}

export class GraphResolver {
  constructor(private readonly context: GraphContext) {}

  byId(nodeId: string): BusinessNode | null {
    return this.context.snapshot.nodes.find((node) => node.id === nodeId) ?? null;
  }

  byType(type: BusinessNodeType): readonly BusinessNode[] {
    return Object.freeze(
      this.context.snapshot.nodes
        .filter((node) => node.type === type)
        .sort((left, right) => left.id.localeCompare(right.id)),
    );
  }

  organization(): BusinessNode | null {
    return this.byType("organization")[0] ?? null;
  }

  department(id?: string): readonly BusinessNode[] {
    return this.resolveTyped("department", id);
  }

  customer(id?: string): readonly BusinessNode[] {
    return this.resolveTyped("customer", id);
  }

  project(id?: string): readonly BusinessNode[] {
    return this.resolveTyped("project", id);
  }

  workflow(id?: string): readonly BusinessNode[] {
    return this.resolveTyped("workflow", id);
  }

  automation(id?: string): readonly BusinessNode[] {
    return this.resolveTyped("automation", id);
  }

  ai(id?: string): readonly BusinessNode[] {
    return this.resolveTyped("ai_agent", id);
  }

  private resolveTyped(
    type: BusinessNodeType,
    id?: string,
  ): readonly BusinessNode[] {
    const nodes = this.byType(type);
    if (!id) return nodes;
    return Object.freeze(
      nodes.filter((node) => node.id === id || node.externalRef === id),
    );
  }
}

type TraversalHook = (
  operation: string,
  nodeId: string,
  count: number,
) => Promise<void>;

export class GraphTraversalService {
  constructor(
    private readonly context: GraphContext,
    private readonly cache: GraphCache,
    private readonly onTraversal: TraversalHook,
  ) {}

  parents(nodeId: string): Promise<readonly BusinessNode[]> {
    return this.direct(nodeId, "parents", "incoming");
  }

  children(nodeId: string): Promise<readonly BusinessNode[]> {
    return this.direct(nodeId, "children", "outgoing");
  }

  ancestors(nodeId: string): Promise<readonly BusinessNode[]> {
    return this.transitive(nodeId, "ancestors", "incoming");
  }

  descendants(nodeId: string): Promise<readonly BusinessNode[]> {
    return this.transitive(nodeId, "descendants", "outgoing");
  }

  dependencies(nodeId: string): Promise<readonly BusinessNode[]> {
    return this.filtered(nodeId, "dependencies", "outgoing", ["depends_on"]);
  }

  dependents(nodeId: string): Promise<readonly BusinessNode[]> {
    return this.filtered(nodeId, "dependents", "incoming", ["depends_on"]);
  }

  async related(
    nodeId: string,
    relationships: readonly BusinessRelationshipType[],
    direction: "incoming" | "outgoing" | "both" = "both",
  ): Promise<readonly BusinessNode[]> {
    this.node(nodeId);
    const operation = `related:${direction}:${[...relationships].sort().join(",")}`;
    const key = traversalKey(this.context, operation, nodeId);
    const cached = this.cache.getTraversal(key);
    if (cached) {
      await this.onTraversal(operation, nodeId, cached.length);
      return cached;
    }
    const incoming =
      direction === "outgoing"
        ? []
        : this.edges(nodeId, "incoming")
            .filter((edge) => relationships.includes(edge.relationship))
            .map((edge) => edge.sourceNodeId);
    const outgoing =
      direction === "incoming"
        ? []
        : this.edges(nodeId, "outgoing")
            .filter((edge) => relationships.includes(edge.relationship))
            .map((edge) => edge.targetNodeId);
    const ids = new Set([...incoming, ...outgoing]);
    const related = Object.freeze(
      this.context.snapshot.nodes
        .filter((node) => ids.has(node.id))
        .sort((left, right) => left.id.localeCompare(right.id)),
    );
    this.cache.setTraversal(key, related);
    await this.onTraversal(operation, nodeId, related.length);
    return related;
  }

  async ownership(nodeId: string): Promise<readonly BusinessNode[]> {
    this.node(nodeId);
    const key = traversalKey(this.context, "ownership", nodeId);
    const cached = this.cache.getTraversal(key);
    if (cached) {
      await this.onTraversal("ownership", nodeId, cached.length);
      return cached;
    }
    const ownerIds = new Set([
      ...this.edges(nodeId, "incoming")
        .filter((edge) => ["owns", "manages"].includes(edge.relationship))
        .map((edge) => edge.sourceNodeId),
      ...this.edges(nodeId, "outgoing")
        .filter((edge) => edge.relationship === "belongs_to")
        .map((edge) => edge.targetNodeId),
    ]);
    const owners = Object.freeze(
      this.context.snapshot.nodes
        .filter((node) => ownerIds.has(node.id))
        .sort((left, right) => left.id.localeCompare(right.id)),
    );
    this.cache.setTraversal(key, owners);
    await this.onTraversal("ownership", nodeId, owners.length);
    return owners;
  }

  async impactChain(nodeId: string): Promise<GraphImpactChain> {
    const source = this.node(nodeId);
    const [dependencies, dependents] = await Promise.all([
      this.transitiveFiltered(
        nodeId,
        "impact_dependencies",
        "outgoing",
        "depends_on",
      ),
      this.transitiveFiltered(
        nodeId,
        "impact_dependents",
        "incoming",
        "depends_on",
      ),
    ]);
    return Object.freeze({ source, dependencies, dependents });
  }

  private node(nodeId: string): BusinessNode {
    const node = this.context.snapshot.nodes.find((item) => item.id === nodeId);
    if (!node) throw new Error(`Graph node "${nodeId}" was not found.`);
    return node;
  }

  private async direct(
    nodeId: string,
    operation: string,
    direction: "incoming" | "outgoing",
  ): Promise<readonly BusinessNode[]> {
    this.node(nodeId);
    const edges = this.edges(nodeId, direction);
    return this.resolveAndRecord(nodeId, operation, edges, direction);
  }

  private async filtered(
    nodeId: string,
    operation: string,
    direction: "incoming" | "outgoing",
    relationships: readonly BusinessRelationshipType[],
  ): Promise<readonly BusinessNode[]> {
    this.node(nodeId);
    const edges = this.edges(nodeId, direction).filter((edge) =>
      relationships.includes(edge.relationship),
    );
    return this.resolveAndRecord(nodeId, operation, edges, direction);
  }

  private async transitive(
    nodeId: string,
    operation: string,
    direction: "incoming" | "outgoing",
  ): Promise<readonly BusinessNode[]> {
    return this.transitiveByEdge(nodeId, operation, direction);
  }

  private async transitiveFiltered(
    nodeId: string,
    operation: string,
    direction: "incoming" | "outgoing",
    relationship: BusinessRelationshipType,
  ): Promise<readonly BusinessNode[]> {
    return this.transitiveByEdge(
      nodeId,
      operation,
      direction,
      relationship,
    );
  }

  private async transitiveByEdge(
    nodeId: string,
    operation: string,
    direction: "incoming" | "outgoing",
    relationship?: BusinessRelationshipType,
  ): Promise<readonly BusinessNode[]> {
    this.node(nodeId);
    const key = traversalKey(this.context, operation, nodeId);
    const cached = this.cache.getTraversal(key);
    if (cached) {
      await this.onTraversal(operation, nodeId, cached.length);
      return cached;
    }

    const visited = new Set<string>([nodeId]);
    const result = new Map<string, BusinessNode>();
    const queue = [nodeId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const edges = this.edges(current, direction).filter(
        (edge) => !relationship || edge.relationship === relationship,
      );
      const adjacent = this.resolveEdges(edges, direction);
      for (const node of adjacent) {
        if (visited.has(node.id)) continue;
        visited.add(node.id);
        result.set(node.id, node);
        queue.push(node.id);
      }
    }
    const nodes = Object.freeze(
      [...result.values()].sort((left, right) => left.id.localeCompare(right.id)),
    );
    this.cache.setTraversal(key, nodes);
    await this.onTraversal(operation, nodeId, nodes.length);
    return nodes;
  }

  private edges(
    nodeId: string,
    direction: "incoming" | "outgoing",
  ): readonly BusinessEdge[] {
    return this.context.snapshot.edges
      .filter((edge) =>
        direction === "incoming"
          ? edge.targetNodeId === nodeId
          : edge.sourceNodeId === nodeId,
      )
      .sort((left, right) => left.id.localeCompare(right.id));
  }

  private resolveEdges(
    edges: readonly BusinessEdge[],
    direction: "incoming" | "outgoing",
  ): readonly BusinessNode[] {
    const ids = new Set(
      edges.map((edge) =>
        direction === "incoming" ? edge.sourceNodeId : edge.targetNodeId,
      ),
    );
    return Object.freeze(
      this.context.snapshot.nodes
        .filter((node) => ids.has(node.id))
        .sort((left, right) => left.id.localeCompare(right.id)),
    );
  }

  private async resolveAndRecord(
    nodeId: string,
    operation: string,
    edges: readonly BusinessEdge[],
    direction: "incoming" | "outgoing",
  ): Promise<readonly BusinessNode[]> {
    const key = traversalKey(this.context, operation, nodeId);
    const cached = this.cache.getTraversal(key);
    const nodes = cached ?? this.resolveEdges(edges, direction);
    if (!cached) this.cache.setTraversal(key, nodes);
    await this.onTraversal(operation, nodeId, nodes.length);
    return nodes;
  }
}

const ownershipRequiredTypes: ReadonlySet<BusinessNodeType> = new Set([
  "business_unit",
  "department",
  "team",
  "project",
  "task",
  "workflow",
  "automation",
  "ai_agent",
]);

export function validateGraphSnapshot(
  snapshot: GraphSnapshot,
): GraphValidationReport {
  const issues: GraphValidationIssue[] = [];
  const nodes = new Map(snapshot.nodes.map((node) => [node.id, node]));
  const edgeIds = new Set<string>();
  const signatures = new Set<string>();
  const connected = new Set<string>();

  for (const edge of snapshot.edges) {
    const signature = `${edge.sourceNodeId}:${edge.relationship}:${edge.targetNodeId}`;
    if (edgeIds.has(edge.id) || signatures.has(signature)) {
      issues.push({
        code: "duplicate_edge",
        severity: "error",
        entityId: edge.id,
        message: "Graph edge ID or relationship signature is duplicated.",
      });
    }
    edgeIds.add(edge.id);
    signatures.add(signature);
    if (!nodes.has(edge.sourceNodeId) || !nodes.has(edge.targetNodeId)) {
      issues.push({
        code: "broken_reference",
        severity: "error",
        entityId: edge.id,
        message: "Graph edge references a node outside this snapshot.",
      });
    } else {
      connected.add(edge.sourceNodeId);
      connected.add(edge.targetNodeId);
    }
    if (!businessRelationshipRegistry.get(edge.relationship)) {
      issues.push({
        code: "invalid_relationship",
        severity: "error",
        entityId: edge.id,
        message: `Relationship "${edge.relationship}" is not registered.`,
      });
    }
  }

  for (const node of snapshot.nodes) {
    if (node.type !== "organization" && !connected.has(node.id)) {
      issues.push({
        code: "orphan_node",
        severity: "warning",
        entityId: node.id,
        message: "Graph node has no relationships.",
      });
    }
    if (ownershipRequiredTypes.has(node.type)) {
      const hasOwner = snapshot.edges.some(
        (edge) =>
          (edge.targetNodeId === node.id &&
            ["owns", "manages"].includes(edge.relationship)) ||
          (edge.sourceNodeId === node.id &&
            edge.relationship === "belongs_to"),
      );
      if (!hasOwner) {
        issues.push({
          code: "missing_owner",
          severity: "warning",
          entityId: node.id,
          message: "Operational graph node has no owning relationship.",
        });
      }
    }
  }

  const dependencyEdges = snapshot.edges.filter(
    (edge) => edge.relationship === "depends_on",
  );
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (nodeId: string, path: readonly string[]): void => {
    if (visiting.has(nodeId)) {
      issues.push({
        code: "circular_dependency",
        severity: "error",
        entityId: nodeId,
        message: `Circular dependency detected: ${[...path, nodeId].join(" -> ")}.`,
      });
      return;
    }
    if (visited.has(nodeId)) return;
    visiting.add(nodeId);
    for (const edge of dependencyEdges
      .filter((item) => item.sourceNodeId === nodeId)
      .sort((left, right) => left.id.localeCompare(right.id))) {
      visit(edge.targetNodeId, [...path, nodeId]);
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
  };
  for (const nodeId of [...nodes.keys()].sort()) visit(nodeId, []);

  const ordered = Object.freeze(
    issues.sort((left, right) =>
      `${left.code}:${left.entityId}`.localeCompare(
        `${right.code}:${right.entityId}`,
      ),
    ),
  );
  return Object.freeze({
    graphId: snapshot.graphId,
    graphVersion: snapshot.version,
    valid: !ordered.some((issue) => issue.severity === "error"),
    issues: ordered,
    checkedAt: new Date().toISOString(),
  });
}

export class GraphRuntime {
  private state: GraphRuntimeState = "stopped";
  private startedAt: string | null = null;
  private readonly sessions = new Map<string, GraphSession>();
  private readonly counters: GraphRuntimeCounters = {
    loads: 0,
    traversals: 0,
    validations: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  constructor(
    private readonly graphs: BusinessGraphService,
    private readonly events: EventBus = new InMemoryEventBus(),
    private readonly cache: GraphCache = new GraphCache(),
  ) {
    this.events.subscribe<Record<string, unknown>>(
      "business.graph.versioned",
      (event) => {
        const orgId = event.payload.tenantId;
        const businessId = event.payload.businessId;
        if (typeof orgId === "string" && typeof businessId === "string") {
          this.cache.invalidate(orgId, businessId);
        }
      },
    );
  }

  start(): GraphRuntimeHealth {
    if (this.state !== "stopped") return this.health();
    this.state = "starting";
    this.startedAt = new Date().toISOString();
    this.state = "running";
    return this.health();
  }

  shutdown(): GraphRuntimeHealth {
    this.state = "stopping";
    this.sessions.clear();
    this.cache.clear();
    this.state = "stopped";
    this.startedAt = null;
    return this.health();
  }

  async openSession(input: {
    readonly orgId: string;
    readonly businessId: string;
    readonly execution: EventContext;
    readonly version?: number;
    readonly requirePublished?: boolean;
  }): Promise<GraphSession> {
    this.assertRunning();
    if (input.execution.orgId !== input.orgId) {
      throw new Error("Graph session tenant does not match execution context.");
    }
    const loaded = await this.loadSnapshot(
      input.orgId,
      input.businessId,
      input.version,
    );
    if (!loaded.snapshot) {
      throw new Error("Business Knowledge Graph was not found.");
    }
    if (
      input.requirePublished !== false &&
      loaded.snapshot.status !== "published"
    ) {
      throw new Error("Graph Runtime requires a published graph.");
    }

    const context: GraphContext = Object.freeze({
      orgId: input.orgId,
      businessId: input.businessId,
      graphId: loaded.snapshot.graphId,
      graphVersion: loaded.snapshot.version,
      snapshot: loaded.snapshot,
      execution: input.execution,
    });
    const sessionId = randomUUID();
    const traversal = new GraphTraversalService(
      context,
      this.cache,
      async (operation, nodeId, count) => {
        this.counters.traversals += 1;
        await this.emit("business.graph.traversed", context, {
          operation,
          nodeId,
          resultCount: count,
        });
      },
    );
    const session: GraphSession = Object.freeze({
      id: sessionId,
      openedAt: new Date().toISOString(),
      context,
      resolver: new GraphResolver(context),
      traversal,
    });
    this.sessions.set(sessionId, session);
    this.counters.loads += 1;
    await this.emit("business.graph.loaded", context, {
      sessionId,
      cacheHit: loaded.cacheHit,
    });
    if (!loaded.cacheHit) {
      await this.emit("business.graph.cache.refreshed", context, {
        reason: "snapshot_loaded",
      });
    }
    return session;
  }

  closeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  async validate(session: GraphSession): Promise<GraphValidationReport> {
    this.assertOwnedSession(session);
    const report = validateGraphSnapshot(session.context.snapshot);
    this.counters.validations += 1;
    await this.emit("business.graph.validated", session.context, {
      valid: report.valid,
      issueCount: report.issues.length,
    });
    return report;
  }

  async resolveExecutionContext(
    orgId: string,
    businessId: string,
    execution: EventContext,
  ): Promise<GraphSnapshot> {
    const session = await this.openSession({
      orgId,
      businessId,
      execution,
      requirePublished: true,
    });
    try {
      return session.context.snapshot;
    } finally {
      this.closeSession(session.id);
    }
  }

  health(): GraphRuntimeHealth {
    const sizes = this.cache.size();
    return Object.freeze({
      state: this.state,
      startedAt: this.startedAt,
      checkedAt: new Date().toISOString(),
      activeSessions: this.sessions.size,
      snapshotCacheEntries: sizes.snapshots,
      traversalCacheEntries: sizes.traversals,
      ...this.counters,
    });
  }

  private async loadSnapshot(
    orgId: string,
    businessId: string,
    version?: number,
  ): Promise<{
    readonly snapshot: GraphSnapshot | null;
    readonly cacheHit: boolean;
  }> {
    if (version !== undefined) {
      const cached = this.cache.getSnapshot(orgId, businessId, version);
      if (cached) {
        this.counters.cacheHits += 1;
        return { snapshot: cached, cacheHit: true };
      }
    }
    this.counters.cacheMisses += 1;
    const snapshot =
      version === undefined
        ? await this.graphs.getCurrent(orgId, businessId)
        : await this.graphs.getVersion(orgId, businessId, version);
    if (snapshot) this.cache.setSnapshot(snapshot);
    return { snapshot, cacheHit: false };
  }

  private assertRunning(): void {
    if (this.state !== "running") {
      throw new Error("Graph Runtime is not running.");
    }
  }

  private assertOwnedSession(session: GraphSession): void {
    if (this.sessions.get(session.id) !== session) {
      throw new Error("Graph session is closed or belongs to another runtime.");
    }
  }

  private async emit(
    type: string,
    context: GraphContext,
    extra: Readonly<Record<string, unknown>>,
  ): Promise<void> {
    await this.events.publish(
      createBossEvent(
        type,
        {
          tenantId: context.orgId,
          organizationId: context.orgId,
          businessId: context.businessId,
          graphId: context.graphId,
          graphVersion: context.graphVersion,
          correlationId: context.execution.correlationId,
          traceId: context.execution.traceId,
          timestamp: new Date().toISOString(),
          ...extra,
        },
        context.execution,
      ),
    );
  }
}

export function createGraphRuntime(
  graphs: BusinessGraphService,
  events?: EventBus,
  cache?: GraphCache,
): GraphRuntime {
  return new GraphRuntime(graphs, events, cache);
}
