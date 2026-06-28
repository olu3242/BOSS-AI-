import {
  createBossEvent,
  InMemoryEventBus,
  type EventBus,
  type EventContext,
} from "@boss/events";
import { businessRelationshipRegistry } from "@boss/registries";
import type {
  BusinessEdge,
  BusinessGraphHistoryEntry,
  BusinessGraphStatus,
  BusinessNode,
  BusinessNodeType,
  BusinessRelationshipType,
  CanonicalBusinessContextData,
  GraphMetadata,
  GraphResolution,
  GraphSnapshot,
} from "@boss/types";
import type { RepositoryContainer } from "../container.js";
import {
  createAuditEvent,
  InMemoryAuditSink,
  type AuditSink,
} from "../observability.js";
import type { BusinessContextService } from "./businessContextService.js";

export interface GraphMutation {
  readonly expectedLockVersion: number;
  readonly reason: string;
  readonly execution: EventContext;
}

export interface BusinessGraphService {
  createFromContext(
    orgId: string,
    businessId: string,
    execution: EventContext,
  ): Promise<GraphSnapshot>;
  synchronizeFromContext(
    orgId: string,
    businessId: string,
    mutation: GraphMutation,
  ): Promise<GraphSnapshot>;
  addNode(
    orgId: string,
    businessId: string,
    node: Omit<BusinessNode, "orgId" | "graphId">,
    mutation: GraphMutation,
  ): Promise<GraphSnapshot>;
  updateNode(
    orgId: string,
    businessId: string,
    node: Omit<BusinessNode, "orgId" | "graphId">,
    mutation: GraphMutation,
  ): Promise<GraphSnapshot>;
  addRelationship(
    orgId: string,
    businessId: string,
    edge: Omit<BusinessEdge, "orgId" | "graphId">,
    mutation: GraphMutation,
  ): Promise<GraphSnapshot>;
  removeRelationship(
    orgId: string,
    businessId: string,
    edgeId: string,
    mutation: GraphMutation,
  ): Promise<GraphSnapshot>;
  transition(
    orgId: string,
    businessId: string,
    status: BusinessGraphStatus,
    mutation: GraphMutation,
  ): Promise<GraphSnapshot>;
  getCurrent(orgId: string, businessId: string): Promise<GraphSnapshot | null>;
  getVersion(
    orgId: string,
    businessId: string,
    version: number,
  ): Promise<GraphSnapshot | null>;
  listVersions(
    orgId: string,
    businessId: string,
  ): Promise<readonly GraphSnapshot[]>;
  listHistory(
    orgId: string,
    businessId: string,
  ): Promise<readonly BusinessGraphHistoryEntry[]>;
}

function stableNodeId(type: BusinessNodeType, id: string): string {
  return `${type}:${id}`;
}

function stableEdgeId(
  relationship: BusinessRelationshipType,
  sourceNodeId: string,
  targetNodeId: string,
): string {
  return `edge:${relationship}:${sourceNodeId}:${targetNodeId}`;
}

function unbindNode(
  node: BusinessNode,
): Omit<BusinessNode, "graphId"> {
  const { graphId, ...unbound } = node;
  void graphId;
  return unbound;
}

function unbindEdge(
  edge: BusinessEdge,
): Omit<BusinessEdge, "graphId"> {
  const { graphId, ...unbound } = edge;
  void graphId;
  return unbound;
}

function metadata(
  discoveryVersion: number,
  owner?: string,
): GraphMetadata {
  return {
    source: "canonical_business_context",
    sourceVersion: discoveryVersion,
    ...(owner ? { owner } : {}),
    extensions: {},
  };
}

export function projectBusinessContextToGraph(
  graphId: string,
  orgId: string,
  businessId: string,
  discoveryVersion: number,
  context: CanonicalBusinessContextData,
): {
  readonly nodes: readonly BusinessNode[];
  readonly edges: readonly BusinessEdge[];
  readonly metadata: GraphMetadata;
} {
  const nodes: BusinessNode[] = [];
  const edges: BusinessEdge[] = [];
  const organizationNodeId = stableNodeId("organization", orgId);
  const businessNodeId = stableNodeId("business_unit", businessId);

  const addNode = (
    id: string,
    type: BusinessNodeType,
    label: string,
    externalRef?: string,
    owner?: string,
  ): string => {
    const nodeId = stableNodeId(type, id);
    nodes.push({
      id: nodeId,
      orgId,
      graphId,
      type,
      label,
      ...(externalRef ? { externalRef } : {}),
      metadata: metadata(discoveryVersion, owner),
    });
    return nodeId;
  };
  const addEdge = (
    sourceNodeId: string,
    targetNodeId: string,
    relationship: BusinessRelationshipType,
  ): void => {
    edges.push({
      id: stableEdgeId(relationship, sourceNodeId, targetNodeId),
      orgId,
      graphId,
      sourceNodeId,
      targetNodeId,
      relationship,
      metadata: metadata(discoveryVersion),
    });
  };

  nodes.push({
    id: organizationNodeId,
    orgId,
    graphId,
    type: "organization",
    label: context.organizationProfile.displayName,
    externalRef: orgId,
    metadata: metadata(discoveryVersion),
  });
  nodes.push({
    id: businessNodeId,
    orgId,
    graphId,
    type: "business_unit",
    label: context.organizationProfile.displayName,
    externalRef: businessId,
    metadata: metadata(discoveryVersion),
  });
  addEdge(organizationNodeId, businessNodeId, "owns");

  for (const department of context.departments) {
    const id = addNode(
      department.id,
      "department",
      department.name,
      department.id,
      department.owner,
    );
    addEdge(businessNodeId, id, "owns");
  }
  for (const team of context.teamStructure.teams) {
    const id = addNode(team.id, "team", team.name, team.id);
    addEdge(businessNodeId, id, "manages");
  }
  for (const customer of context.customerSegments) {
    const id = addNode(customer.id, "customer", customer.name, customer.id);
    addEdge(businessNodeId, id, "serves");
  }
  for (const offering of context.productsAndServices) {
    const kind =
      offering.extensions?.kind === "product" ? "product" : "service";
    const id = addNode(offering.id, kind, offering.name, offering.id);
    addEdge(businessNodeId, id, "produces");
  }
  for (const stream of context.revenueStreams) {
    const id = addNode(
      stream.id,
      "revenue_stream",
      stream.name,
      stream.id,
    );
    addEdge(businessNodeId, id, "owns");
  }
  for (const goal of context.goals) {
    const id = addNode(goal.id, "objective", goal.title, goal.id);
    addEdge(businessNodeId, id, "owns");
  }
  for (const kpi of context.kpis) {
    const id = addNode(kpi.id, "kpi", kpi.name, kpi.id, kpi.owner);
    addEdge(id, businessNodeId, "measures");
  }
  for (const requirement of context.complianceRequirements) {
    const id = addNode(
      requirement.id,
      "policy",
      requirement.name,
      requirement.id,
    );
    addEdge(businessNodeId, id, "governed_by");
  }

  return {
    nodes: Object.freeze(nodes.sort((left, right) => left.id.localeCompare(right.id))),
    edges: Object.freeze(edges.sort((left, right) => left.id.localeCompare(right.id))),
    metadata: metadata(discoveryVersion),
  };
}

function assertTenant(orgId: string, execution: EventContext): void {
  if (execution.orgId !== orgId) {
    throw new Error("Graph execution tenant does not match the organization.");
  }
}

function assertGraphIntegrity(
  nodes: readonly BusinessNode[],
  edges: readonly BusinessEdge[],
): void {
  const nodeIds = new Set(nodes.map((node) => node.id));
  if (nodeIds.size !== nodes.length) {
    throw new Error("Business graph node IDs must be unique.");
  }
  const edgeIds = new Set<string>();
  const signatures = new Set<string>();
  for (const edge of edges) {
    if (!nodeIds.has(edge.sourceNodeId) || !nodeIds.has(edge.targetNodeId)) {
      throw new Error("Business graph relationships require existing nodes.");
    }
    if (!businessRelationshipRegistry.get(edge.relationship)) {
      throw new Error(
        `Business graph relationship "${edge.relationship}" is not registered.`,
      );
    }
    const signature = `${edge.sourceNodeId}:${edge.relationship}:${edge.targetNodeId}`;
    if (edgeIds.has(edge.id) || signatures.has(signature)) {
      throw new Error("Business graph relationships must be unique.");
    }
    edgeIds.add(edge.id);
    signatures.add(signature);
  }
}

function eventPayload(
  snapshot: GraphSnapshot,
  execution: EventContext,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    tenantId: snapshot.orgId,
    organizationId: snapshot.orgId,
    businessId: snapshot.businessId,
    graphId: snapshot.graphId,
    graphVersion: snapshot.version,
    correlationId: execution.correlationId,
    traceId: execution.traceId,
    timestamp: new Date().toISOString(),
  });
}

export function createBusinessGraphService(
  repos: RepositoryContainer,
  contexts: BusinessContextService,
  eventBus: EventBus = new InMemoryEventBus(),
  auditSink: AuditSink = new InMemoryAuditSink(),
): BusinessGraphService {
  const publish = async (
    type: string,
    snapshot: GraphSnapshot,
    execution: EventContext,
    extra: Readonly<Record<string, unknown>> = {},
  ): Promise<void> => {
    await eventBus.publish(
      createBossEvent(
        type,
        { ...eventPayload(snapshot, execution), ...extra },
        execution,
      ),
    );
  };
  const audit = (
    action: string,
    snapshot: GraphSnapshot,
    execution: EventContext,
    reason: string,
  ): void | Promise<void> =>
    auditSink.record(
      createAuditEvent({
        traceId: execution.traceId,
        orgId: snapshot.orgId,
        actorId: execution.actorId,
        action,
        resourceType: "business_graph",
        resourceId: snapshot.graphId,
        outcome: "success",
        metadata: {
          requestId: execution.requestId,
          correlationId: execution.correlationId,
          businessId: snapshot.businessId,
          graphVersion: snapshot.version,
          reason,
        },
      }),
    );
  const mutationContext = (mutation: GraphMutation) => ({
    actorId: mutation.execution.actorId,
    correlationId: mutation.execution.correlationId,
    traceId: mutation.execution.traceId,
    reason: mutation.reason,
  });
  const emitVersion = async (
    snapshot: GraphSnapshot,
    execution: EventContext,
  ): Promise<void> => {
    await publish("business.graph.versioned", snapshot, execution);
  };

  return {
    async createFromContext(orgId, businessId, execution) {
      assertTenant(orgId, execution);
      const context = await contexts.getCurrent(orgId, businessId);
      if (!context || context.status !== "published") {
        throw new Error(
          "Business Knowledge Graph requires published canonical Business Context.",
        );
      }
      const placeholderGraphId = "pending";
      const projection = projectBusinessContextToGraph(
        placeholderGraphId,
        orgId,
        businessId,
        context.discoveryVersion,
        context.context,
      );
      assertGraphIntegrity(projection.nodes, projection.edges);
      const snapshot = await repos.businessGraph.create({
        orgId,
        businessId,
        discoveryId: context.id,
        sourceDiscoveryVersion: context.discoveryVersion,
        nodes: projection.nodes.map(unbindNode),
        edges: projection.edges.map(unbindEdge),
        metadata: projection.metadata,
        mutation: {
          actorId: execution.actorId,
          correlationId: execution.correlationId,
          traceId: execution.traceId,
          reason: "Graph projected from canonical Business Context.",
        },
      });
      await publish("business.graph.created", snapshot, execution);
      for (const node of snapshot.nodes) {
        await publish("business.node.created", snapshot, execution, {
          nodeId: node.id,
        });
      }
      for (const edge of snapshot.edges) {
        await publish(
          "business.relationship.created",
          snapshot,
          execution,
          { edgeId: edge.id },
        );
      }
      await emitVersion(snapshot, execution);
      await audit(
        "business.graph.created",
        snapshot,
        execution,
        "Graph projected from canonical Business Context.",
      );
      return snapshot;
    },

    async synchronizeFromContext(orgId, businessId, mutation) {
      assertTenant(orgId, mutation.execution);
      const [current, context] = await Promise.all([
        repos.businessGraph.getCurrent(orgId, businessId),
        contexts.getCurrent(orgId, businessId),
      ]);
      if (!current || !context || context.status !== "published") {
        throw new Error("Published context and an existing graph are required.");
      }
      const projection = projectBusinessContextToGraph(
        current.graphId,
        orgId,
        businessId,
        context.discoveryVersion,
        context.context,
      );
      assertGraphIntegrity(projection.nodes, projection.edges);
      const snapshot = await repos.businessGraph.saveSnapshot({
        orgId,
        businessId,
        expectedLockVersion: mutation.expectedLockVersion,
        sourceDiscoveryVersion: context.discoveryVersion,
        nodes: projection.nodes.map(unbindNode),
        edges: projection.edges.map(unbindEdge),
        metadata: projection.metadata,
        action: "versioned",
        mutation: mutationContext(mutation),
      });
      await emitVersion(snapshot, mutation.execution);
      await audit(
        "business.graph.versioned",
        snapshot,
        mutation.execution,
        mutation.reason,
      );
      return snapshot;
    },

    async addNode(orgId, businessId, node, mutation) {
      assertTenant(orgId, mutation.execution);
      const current = await repos.businessGraph.getCurrent(orgId, businessId);
      if (!current) throw new Error("Business Knowledge Graph was not found.");
      const nodes = [...current.nodes, { ...node, orgId, graphId: current.graphId }];
      assertGraphIntegrity(nodes, current.edges);
      const snapshot = await repos.businessGraph.saveSnapshot({
        orgId,
        businessId,
        expectedLockVersion: mutation.expectedLockVersion,
        sourceDiscoveryVersion: current.sourceDiscoveryVersion,
        nodes: nodes.map(unbindNode),
        edges: current.edges.map(unbindEdge),
        metadata: current.metadata,
        action: "node_created",
        mutation: mutationContext(mutation),
      });
      await publish("business.node.created", snapshot, mutation.execution, {
        nodeId: node.id,
      });
      await emitVersion(snapshot, mutation.execution);
      await audit("business.node.created", snapshot, mutation.execution, mutation.reason);
      return snapshot;
    },

    async updateNode(orgId, businessId, node, mutation) {
      assertTenant(orgId, mutation.execution);
      const current = await repos.businessGraph.getCurrent(orgId, businessId);
      if (!current) throw new Error("Business Knowledge Graph was not found.");
      if (!current.nodes.some((item) => item.id === node.id)) {
        throw new Error(`Business graph node "${node.id}" was not found.`);
      }
      const nodes = current.nodes.map((item) =>
        item.id === node.id ? { ...node, orgId, graphId: current.graphId } : item,
      );
      assertGraphIntegrity(nodes, current.edges);
      const snapshot = await repos.businessGraph.saveSnapshot({
        orgId,
        businessId,
        expectedLockVersion: mutation.expectedLockVersion,
        sourceDiscoveryVersion: current.sourceDiscoveryVersion,
        nodes: nodes.map(unbindNode),
        edges: current.edges.map(unbindEdge),
        metadata: current.metadata,
        action: "node_updated",
        mutation: mutationContext(mutation),
      });
      await publish("business.node.updated", snapshot, mutation.execution, {
        nodeId: node.id,
      });
      await emitVersion(snapshot, mutation.execution);
      await audit("business.node.updated", snapshot, mutation.execution, mutation.reason);
      return snapshot;
    },

    async addRelationship(orgId, businessId, edge, mutation) {
      assertTenant(orgId, mutation.execution);
      const current = await repos.businessGraph.getCurrent(orgId, businessId);
      if (!current) throw new Error("Business Knowledge Graph was not found.");
      const edges = [...current.edges, { ...edge, orgId, graphId: current.graphId }];
      assertGraphIntegrity(current.nodes, edges);
      const snapshot = await repos.businessGraph.saveSnapshot({
        orgId,
        businessId,
        expectedLockVersion: mutation.expectedLockVersion,
        sourceDiscoveryVersion: current.sourceDiscoveryVersion,
        nodes: current.nodes.map(unbindNode),
        edges: edges.map(unbindEdge),
        metadata: current.metadata,
        action: "relationship_created",
        mutation: mutationContext(mutation),
      });
      await publish(
        "business.relationship.created",
        snapshot,
        mutation.execution,
        { edgeId: edge.id },
      );
      await emitVersion(snapshot, mutation.execution);
      await audit(
        "business.relationship.created",
        snapshot,
        mutation.execution,
        mutation.reason,
      );
      return snapshot;
    },

    async removeRelationship(orgId, businessId, edgeId, mutation) {
      assertTenant(orgId, mutation.execution);
      const current = await repos.businessGraph.getCurrent(orgId, businessId);
      if (!current) throw new Error("Business Knowledge Graph was not found.");
      const edges = current.edges.filter((edge) => edge.id !== edgeId);
      if (edges.length === current.edges.length) {
        throw new Error(`Business graph relationship "${edgeId}" was not found.`);
      }
      const snapshot = await repos.businessGraph.saveSnapshot({
        orgId,
        businessId,
        expectedLockVersion: mutation.expectedLockVersion,
        sourceDiscoveryVersion: current.sourceDiscoveryVersion,
        nodes: current.nodes.map(unbindNode),
        edges: edges.map(unbindEdge),
        metadata: current.metadata,
        action: "relationship_removed",
        mutation: mutationContext(mutation),
      });
      await publish(
        "business.relationship.removed",
        snapshot,
        mutation.execution,
        { edgeId },
      );
      await emitVersion(snapshot, mutation.execution);
      await audit(
        "business.relationship.removed",
        snapshot,
        mutation.execution,
        mutation.reason,
      );
      return snapshot;
    },

    async transition(orgId, businessId, status, mutation) {
      assertTenant(orgId, mutation.execution);
      const current = await repos.businessGraph.getCurrent(orgId, businessId);
      if (!current) throw new Error("Business Knowledge Graph was not found.");
      const allowed =
        (current.status === "draft" && status === "published") ||
        (current.status === "published" && status === "archived");
      if (!allowed) {
        throw new Error(
          `Business graph cannot transition from ${current.status} to ${status}.`,
        );
      }
      const snapshot = await repos.businessGraph.transition({
        orgId,
        businessId,
        expectedLockVersion: mutation.expectedLockVersion,
        status,
        mutation: mutationContext(mutation),
      });
      await emitVersion(snapshot, mutation.execution);
      await audit(
        `business.graph.${status}`,
        snapshot,
        mutation.execution,
        mutation.reason,
      );
      return snapshot;
    },

    getCurrent: (orgId, businessId) =>
      repos.businessGraph.getCurrent(orgId, businessId),
    getVersion: (orgId, businessId, version) =>
      repos.businessGraph.getVersion(orgId, businessId, version),
    listVersions: (orgId, businessId) =>
      repos.businessGraph.listVersions(orgId, businessId),
    listHistory: (orgId, businessId) =>
      repos.businessGraph.listHistory(orgId, businessId),
  };
}

export class GraphResolutionEngine {
  constructor(private readonly graphs: BusinessGraphService) {}

  async resolveById(
    orgId: string,
    businessId: string,
    nodeId: string,
    version?: number,
  ): Promise<GraphResolution | null> {
    const graph = version
      ? await this.graphs.getVersion(orgId, businessId, version)
      : await this.graphs.getCurrent(orgId, businessId);
    if (!graph) return null;
    const node = graph.nodes.find((item) => item.id === nodeId);
    if (!node) return null;
    return Object.freeze({
      graphId: graph.graphId,
      graphVersion: graph.version,
      node,
      incoming: Object.freeze(
        graph.edges
          .filter((edge) => edge.targetNodeId === nodeId)
          .sort((left, right) => left.id.localeCompare(right.id)),
      ),
      outgoing: Object.freeze(
        graph.edges
          .filter((edge) => edge.sourceNodeId === nodeId)
          .sort((left, right) => left.id.localeCompare(right.id)),
      ),
    });
  }

  async neighbors(
    orgId: string,
    businessId: string,
    nodeId: string,
    version?: number,
  ): Promise<readonly BusinessNode[]> {
    const resolution = await this.resolveById(
      orgId,
      businessId,
      nodeId,
      version,
    );
    if (!resolution) return Object.freeze([]);
    const graph = version
      ? await this.graphs.getVersion(orgId, businessId, version)
      : await this.graphs.getCurrent(orgId, businessId);
    if (!graph) return Object.freeze([]);
    const ids = new Set([
      ...resolution.incoming.map((edge) => edge.sourceNodeId),
      ...resolution.outgoing.map((edge) => edge.targetNodeId),
    ]);
    return Object.freeze(
      graph.nodes
        .filter((node) => ids.has(node.id))
        .sort((left, right) => left.id.localeCompare(right.id)),
    );
  }

  ownership(
    orgId: string,
    businessId: string,
    nodeId: string,
    version?: number,
  ): Promise<readonly BusinessEdge[]> {
    return this.edgesByRelationship(
      orgId,
      businessId,
      nodeId,
      ["owns", "manages", "belongs_to"],
      version,
    );
  }

  dependencies(
    orgId: string,
    businessId: string,
    nodeId: string,
    version?: number,
  ): Promise<readonly BusinessEdge[]> {
    return this.edgesByRelationship(
      orgId,
      businessId,
      nodeId,
      ["depends_on"],
      version,
    );
  }

  async upstream(
    orgId: string,
    businessId: string,
    nodeId: string,
    version?: number,
  ): Promise<readonly BusinessEdge[]> {
    return (
      await this.resolveById(orgId, businessId, nodeId, version)
    )?.incoming ?? Object.freeze([]);
  }

  async downstream(
    orgId: string,
    businessId: string,
    nodeId: string,
    version?: number,
  ): Promise<readonly BusinessEdge[]> {
    return (
      await this.resolveById(orgId, businessId, nodeId, version)
    )?.outgoing ?? Object.freeze([]);
  }

  async resolveExecutionContext(
    orgId: string,
    businessId: string,
  ): Promise<GraphSnapshot> {
    const graph = await this.graphs.getCurrent(orgId, businessId);
    if (!graph || graph.status !== "published") {
      throw new Error("Execution requires a published Business Knowledge Graph.");
    }
    return graph;
  }

  private async edgesByRelationship(
    orgId: string,
    businessId: string,
    nodeId: string,
    relationships: readonly BusinessRelationshipType[],
    version?: number,
  ): Promise<readonly BusinessEdge[]> {
    const resolution = await this.resolveById(
      orgId,
      businessId,
      nodeId,
      version,
    );
    if (!resolution) return Object.freeze([]);
    return Object.freeze(
      [...resolution.incoming, ...resolution.outgoing]
        .filter((edge) => relationships.includes(edge.relationship))
        .sort((left, right) => left.id.localeCompare(right.id)),
    );
  }
}
