export type GraphRegistryId =
  | "business_outcome"
  | "business_objective"
  | "department"
  | "agent"
  | "capability"
  | "prompt"
  | "workflow"
  | "automation"
  | "trigger"
  | "event"
  | "notification"
  | "integration"
  | "kpi"
  | "orchestrator";

export interface GraphNodeReference {
  readonly registry: GraphRegistryId;
  readonly id: string;
}

export interface GraphNode {
  readonly ref: GraphNodeReference;
  readonly displayName: string;
  readonly owner: string;
  readonly tags: readonly string[];
}

export interface GraphEdge {
  readonly from: GraphNodeReference;
  readonly to: GraphNodeReference;
  readonly relationship: string;
}

export interface ExecutionReferenceIndexes {
  readonly agentToWorkflow: Readonly<Record<string, readonly string[]>>;
  readonly agentToCapability: Readonly<Record<string, readonly string[]>>;
  readonly workflowToEvents: Readonly<Record<string, readonly string[]>>;
  readonly workflowToAutomations: Readonly<Record<string, readonly string[]>>;
  readonly workflowToTriggers: Readonly<Record<string, readonly string[]>>;
  readonly automationToNotifications: Readonly<Record<string, readonly string[]>>;
  readonly eventToPublishers: Readonly<Record<string, readonly string[]>>;
  readonly eventToSubscribers: Readonly<Record<string, readonly string[]>>;
  readonly departmentToAgents: Readonly<Record<string, readonly string[]>>;
  readonly integrationToWorkflows: Readonly<Record<string, readonly string[]>>;
}

export interface RegistryHealthAnalysis {
  readonly duplicateNodeIds: readonly string[];
  readonly orphanNodeIds: readonly string[];
  readonly brokenReferences: readonly string[];
  readonly cyclicReferences: readonly string[];
  readonly unusedPromptIds: readonly string[];
  readonly missingOwnerNodeIds: readonly string[];
  readonly emptyRegistryIds: readonly GraphRegistryId[];
}

export interface ImpactModel {
  readonly source: GraphNodeReference;
  readonly upstream: readonly GraphNodeReference[];
  readonly downstream: readonly GraphNodeReference[];
}

export interface ExecutionArchitectureSnapshot {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly indexes: ExecutionReferenceIndexes;
  readonly health: RegistryHealthAnalysis;
}

const emptyIndexes: ExecutionReferenceIndexes = {
  agentToWorkflow: {},
  agentToCapability: {},
  workflowToEvents: {},
  workflowToAutomations: {},
  workflowToTriggers: {},
  automationToNotifications: {},
  eventToPublishers: {},
  eventToSubscribers: {},
  departmentToAgents: {},
  integrationToWorkflows: {},
};

let current: ExecutionArchitectureSnapshot = Object.freeze({
  nodes: Object.freeze([]),
  edges: Object.freeze([]),
  indexes: Object.freeze(emptyIndexes),
  health: Object.freeze({
    duplicateNodeIds: Object.freeze([]),
    orphanNodeIds: Object.freeze([]),
    brokenReferences: Object.freeze([]),
    cyclicReferences: Object.freeze([]),
    unusedPromptIds: Object.freeze([]),
    missingOwnerNodeIds: Object.freeze([]),
    emptyRegistryIds: Object.freeze([]),
  }),
});

function referenceKey(ref: GraphNodeReference): string {
  return `${ref.registry}:${ref.id}`;
}

function collectReachable(
  source: GraphNodeReference,
  edges: readonly GraphEdge[],
  direction: "upstream" | "downstream",
): readonly GraphNodeReference[] {
  const result = new Map<string, GraphNodeReference>();
  const queue = [source];
  const sourceKey = referenceKey(source);

  while (queue.length > 0) {
    const currentRef = queue.shift();
    if (!currentRef) {
      break;
    }
    for (const edge of edges) {
      const candidate =
        direction === "downstream" && referenceKey(edge.from) === referenceKey(currentRef)
          ? edge.to
          : direction === "upstream" && referenceKey(edge.to) === referenceKey(currentRef)
            ? edge.from
            : undefined;
      if (!candidate) {
        continue;
      }
      const key = referenceKey(candidate);
      if (key !== sourceKey && !result.has(key)) {
        result.set(key, candidate);
        queue.push(candidate);
      }
    }
  }

  return Object.freeze(Array.from(result.values()));
}

function detectCycles(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
): readonly string[] {
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) {
    adjacency.set(referenceKey(node.ref), []);
  }
  for (const edge of edges) {
    adjacency.get(referenceKey(edge.from))?.push(referenceKey(edge.to));
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cycles = new Set<string>();

  const visit = (key: string): void => {
    if (visiting.has(key)) {
      cycles.add(key);
      return;
    }
    if (visited.has(key)) {
      return;
    }
    visiting.add(key);
    for (const target of adjacency.get(key) ?? []) {
      visit(target);
    }
    visiting.delete(key);
    visited.add(key);
  };

  for (const key of adjacency.keys()) {
    visit(key);
  }
  return Object.freeze(Array.from(cycles).sort());
}

function analyze(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
): RegistryHealthAnalysis {
  const counts = new Map<string, number>();
  for (const node of nodes) {
    const key = referenceKey(node.ref);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const nodeKeys = new Set(counts.keys());
  const connected = new Set(
    edges.flatMap((edge) => [referenceKey(edge.from), referenceKey(edge.to)]),
  );
  const registryCounts = new Map<GraphRegistryId, number>();
  for (const node of nodes) {
    registryCounts.set(node.ref.registry, (registryCounts.get(node.ref.registry) ?? 0) + 1);
  }
  const registries: GraphRegistryId[] = [
    "business_outcome",
    "business_objective",
    "department",
    "agent",
    "capability",
    "prompt",
    "workflow",
    "automation",
    "trigger",
    "event",
    "notification",
    "integration",
    "kpi",
    "orchestrator",
  ];

  return Object.freeze({
    duplicateNodeIds: Object.freeze(
      Array.from(counts)
        .filter(([, count]) => count > 1)
        .map(([key]) => key)
        .sort(),
    ),
    orphanNodeIds: Object.freeze(
      Array.from(nodeKeys).filter((key) => !connected.has(key)).sort(),
    ),
    brokenReferences: Object.freeze(
      edges
        .flatMap((edge) => [edge.from, edge.to])
        .filter((entry) => !nodeKeys.has(referenceKey(entry)))
        .map(referenceKey)
        .filter((key, index, values) => values.indexOf(key) === index)
        .sort(),
    ),
    cyclicReferences: detectCycles(nodes, edges),
    unusedPromptIds: Object.freeze(
      nodes
        .filter((entry) => entry.ref.registry === "prompt" && !connected.has(referenceKey(entry.ref)))
        .map((entry) => entry.ref.id)
        .sort(),
    ),
    missingOwnerNodeIds: Object.freeze(
      nodes
        .filter((entry) => entry.owner.length === 0)
        .map((entry) => referenceKey(entry.ref))
        .sort(),
    ),
    emptyRegistryIds: Object.freeze(
      registries.filter((registry) => (registryCounts.get(registry) ?? 0) === 0),
    ),
  });
}

export function registerExecutionArchitecture(
  nodes: readonly GraphNode[],
  edges: readonly GraphEdge[],
  indexes: ExecutionReferenceIndexes,
): void {
  const frozenNodes = Object.freeze([...nodes]);
  const frozenEdges = Object.freeze([...edges]);
  current = Object.freeze({
    nodes: frozenNodes,
    edges: frozenEdges,
    indexes: Object.freeze(indexes),
    health: analyze(frozenNodes, frozenEdges),
  });
}

function impact(registry: GraphRegistryId, id: string): ImpactModel {
  const source = { registry, id } as const;
  return Object.freeze({
    source,
    upstream: collectReachable(source, current.edges, "upstream"),
    downstream: collectReachable(source, current.edges, "downstream"),
  });
}

export const dependencyGraph = {
  snapshot: (): ExecutionArchitectureSnapshot => current,
  impact: {
    agent: (id: string) => impact("agent", id),
    capability: (id: string) => impact("capability", id),
    workflow: (id: string) => impact("workflow", id),
    automation: (id: string) => impact("automation", id),
    event: (id: string) => impact("event", id),
    department: (id: string) => impact("department", id),
    businessOutcome: (id: string) => impact("business_outcome", id),
  },
} as const;
