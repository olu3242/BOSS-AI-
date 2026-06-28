import { dashboardRegistry } from "../registries/dashboard.js";
import { featureRegistry } from "../registries/feature.js";
import { runtimeRegistry } from "../registries/runtime.js";

const features = [
  {
    id: "universal_capability_runtime",
    displayName: "Universal Capability Runtime",
    description: "Capability-agnostic execution contracts, context, state machine, events, errors, and observability.",
    sourcePaths: [
      "packages/types/src/ucr.ts",
      "packages/loop/src/universalCapabilityRuntime.ts",
    ],
    owner: "Platform",
    status: "internal_alpha" as const,
  },
  {
    id: "capability_pack_platform",
    displayName: "Capability Pack Platform",
    description: "Shared signed-pack lifecycle, compatibility, installation, activation, upgrade, and rollback infrastructure.",
    sourcePaths: [
      "packages/types/src/capabilityPack.ts",
      "packages/capabilities/src",
    ],
    owner: "Platform",
    status: "internal_alpha" as const,
  },
  {
    id: "business_knowledge_graph",
    displayName: "Business Knowledge Graph",
    description: "Versioned, tenant-scoped business relationships with deterministic resolution.",
    sourcePaths: [
      "packages/types/src/businessGraph.ts",
      "apps/api/src/services/businessGraphService.ts",
    ],
    owner: "Platform",
    status: "internal_alpha" as const,
  },
  {
    id: "business_semantic_layer",
    displayName: "Business Semantic Layer",
    description: "Versioned anti-corruption layer for deterministic business meaning and views.",
    sourcePaths: [
      "packages/types/src/businessSemantic.ts",
      "apps/api/src/services/businessSemanticLayer.ts",
    ],
    owner: "Platform",
    status: "internal_alpha" as const,
  },
  {
    id: "business_query_insight_layer",
    displayName: "Business Query & Insight Layer",
    description: "Canonical, deterministic, version-aware business read models and factual insights.",
    sourcePaths: [
      "packages/types/src/businessQuery.ts",
      "apps/api/src/services/businessQueryService.ts",
    ],
    owner: "Platform",
    status: "internal_alpha" as const,
  },
  {
    id: "canonical_business_discovery",
    displayName: "Canonical Business Discovery",
    description: "Versioned, tenant-scoped Business Context and lifecycle service.",
    sourcePaths: [
      "packages/types/src/businessContext.ts",
      "apps/api/src/services/businessContextService.ts",
    ],
    owner: "Platform",
    status: "internal_alpha" as const,
  },
  {
    id: "business_intelligence",
    displayName: "Business Intelligence",
    description: "Deterministic business DNA, health, constraint, and recommendation analysis.",
    sourcePaths: ["packages/mcp/src/intelligence", "apps/api/src/services"],
    owner: "Analytics",
    status: "internal_alpha" as const,
  },
  {
    id: "executive_command_center",
    displayName: "Executive Command Center",
    description: "Next.js command-center view for business metrics, constraints, agents, and automation health.",
    sourcePaths: ["apps/web/app/page.tsx", "apps/web/src/commandCenter.ts"],
    owner: "Executive",
    status: "internal_alpha" as const,
  },
  {
    id: "registry_architecture",
    displayName: "Registry Architecture",
    description: "Readonly agent, capability, execution, graph, and governance catalogs.",
    sourcePaths: ["packages/registries/src"],
    owner: "Platform",
    status: "available" as const,
  },
] as const;

export function seedPlatformCatalogs(): void {
  for (const feature of features) {
    featureRegistry.register({
      ...feature,
      key: feature.id,
      label: feature.displayName,
      version: "1.0.0",
    });
  }

  dashboardRegistry.register({
    id: "executive_command_center",
    displayName: "Executive Command Center",
    key: "executive_command_center",
    label: "Executive Command Center",
    description: "Internal-alpha dashboard backed by the command-center snapshot.",
    route: "/",
    featureIds: ["business_intelligence", "executive_command_center"],
    dataSourceIds: ["demo_command_center"],
    owner: "Executive",
    version: "1.0.0",
    status: "internal_alpha",
    documentation: "apps/web/app/page.tsx",
  });

  const runtimes = [
    ["identity_runtime", "Identity Runtime", "identity", "@boss/api", "apps/api/src/identity.ts"],
    ["agent_runtime", "Agent Runtime", "agent", "@boss/loop", "packages/loop/src/agentRuntime.ts"],
    ["workflow_runtime", "Workflow Runtime", "workflow", "@boss/loop", "packages/loop/src/workflowRuntime.ts"],
    ["event_runtime", "Event Runtime", "event", "@boss/events", "packages/events/src/index.ts"],
    ["queue_runtime", "Queue Runtime", "queue", "@boss/loop", "packages/loop/src/queueRuntime.ts"],
    ["scheduler_runtime", "Scheduler Runtime", "scheduler", "@boss/loop", "packages/loop/src/schedulerRuntime.ts"],
    ["observability_runtime", "Observability Runtime", "observability", "@boss/loop", "packages/loop/src/telemetry.ts"],
    ["business_context_runtime", "Business Context Runtime", "discovery", "@boss/api", "apps/api/src/services/businessContextService.ts"],
    ["business_knowledge_graph", "Business Knowledge Graph", "graph", "@boss/api", "apps/api/src/services/businessGraphService.ts"],
    ["business_graph_repository", "Business Graph Repository", "graph", "@boss/db", "packages/db/src/repositories/types.ts"],
    ["graph_resolution_engine", "Graph Resolution Engine", "graph", "@boss/api", "apps/api/src/services/businessGraphService.ts"],
    ["graph_runtime", "Graph Runtime", "graph", "@boss/api", "apps/api/src/services/businessGraphRuntime.ts"],
    ["graph_traversal_service", "Graph Traversal Service", "graph", "@boss/api", "apps/api/src/services/businessGraphRuntime.ts"],
    ["graph_validation_service", "Graph Validation Service", "graph", "@boss/api", "apps/api/src/services/businessGraphRuntime.ts"],
    ["graph_cache", "Graph Cache", "graph", "@boss/api", "apps/api/src/services/businessGraphRuntime.ts"],
    ["business_semantic_layer", "Business Semantic Layer", "semantic", "@boss/api", "apps/api/src/services/businessSemanticLayer.ts"],
    ["context_resolution_service", "Context Resolution Service", "semantic", "@boss/api", "apps/api/src/services/businessSemanticLayer.ts"],
    ["semantic_view_registry", "Semantic View Registry", "semantic", "@boss/registries", "packages/registries/src/registries/semanticView.ts"],
    ["dependency_resolution_service", "Dependency Resolution Service", "semantic", "@boss/api", "apps/api/src/services/businessSemanticLayer.ts"],
    ["business_query_service", "Business Query Service", "query", "@boss/api", "apps/api/src/services/businessQueryService.ts"],
    ["projection_engine", "Projection Engine", "query", "@boss/api", "apps/api/src/services/businessQueryService.ts"],
    ["business_insight_service", "Business Insight Service", "query", "@boss/api", "apps/api/src/services/businessQueryService.ts"],
    ["query_catalog", "Query Catalog", "query", "@boss/registries", "packages/registries/src/registries/businessQuery.ts"],
    ["capability_pack_registry", "Capability Pack Registry", "capability", "@boss/registries", "packages/registries/src/registries/capabilityPack.ts"],
    ["pack_loader", "Pack Loader", "capability", "@boss/capabilities", "packages/capabilities/src/runtime.ts"],
    ["capability_dependency_resolver", "Capability Dependency Resolver", "capability", "@boss/capabilities", "packages/capabilities/src/runtime.ts"],
    ["capability_compatibility_validator", "Capability Compatibility Validator", "capability", "@boss/capabilities", "packages/capabilities/src/runtime.ts"],
    ["universal_capability_runtime", "Universal Capability Runtime", "capability", "@boss/loop", "packages/loop/src/universalCapabilityRuntime.ts"],
    ["capability_execution_pipeline", "Capability Execution Pipeline", "capability", "@boss/loop", "packages/loop/src/universalCapabilityRuntime.ts"],
    ["capability_execution_state_machine", "Capability Execution State Machine", "capability", "@boss/loop", "packages/loop/src/universalCapabilityRuntime.ts"],
  ] as const;

  for (const [id, displayName, kind, implementationPackage, documentation] of runtimes) {
    runtimeRegistry.register({
      id,
      displayName,
      key: id,
      label: displayName,
      kind,
      implementationPackage,
      owner: "Platform",
      version: "0.1.0",
      status: "internal_alpha",
      documentation,
    });
  }
}
