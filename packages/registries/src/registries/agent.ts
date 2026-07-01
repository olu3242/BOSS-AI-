import type { RegistryEntry } from "../types.js";

export type Lifecycle = "draft" | "available" | "deprecated" | "disabled";

export type ExecutionMode = "manual" | "event" | "schedule";

export type AgentPriority = "critical" | "high" | "medium" | "low";

export type AgentStatus = "defined" | "active" | "inactive" | "retired";

export type RegistrationState = "registered" | "unregistered";

export type DeploymentState = "not_deployed" | "deployed" | "suspended";

export type BusinessSize = "micro" | "small" | "medium" | "enterprise";

export type DepartmentId =
  | "executive"
  | "operations"
  | "sales"
  | "marketing"
  | "finance"
  | "customer_success"
  | "support"
  | "compliance"
  | "analytics"
  | "administration"
  | "knowledge"
  | "automation";

export type HealthStatus =
  | "not_registered"
  | "unknown"
  | "healthy"
  | "degraded"
  | "unavailable";

export interface Department {
  readonly id: DepartmentId;
  readonly displayName: string;
  /** @deprecated Use id. */
  readonly key: DepartmentId;
  /** @deprecated Use displayName. */
  readonly label: string;
}

export interface Capability {
  readonly id: string;
  /** @deprecated Use id. */
  readonly key: string;
}

export interface Skill {
  readonly key: string;
}

export interface Workflow {
  readonly key: string;
}

export interface Trigger {
  readonly id: ExecutionMode;
  /** @deprecated Use id. */
  readonly key: ExecutionMode;
}

export interface Automation {
  readonly id: string;
  /** @deprecated Use id. */
  readonly key: string;
}

export interface NotificationChannel {
  readonly id: string;
  /** @deprecated Use id. */
  readonly key: string;
}

export interface BusinessDomain {
  readonly id: string;
  readonly displayName: string;
  /** @deprecated Use id. */
  readonly key: string;
}

export interface PromptReference {
  readonly id: string;
  readonly version: string;
  /** @deprecated Use id. */
  readonly key: string;
}

export interface WorkflowReference {
  readonly id: string;
  /** @deprecated Use id. */
  readonly key: string;
}

export interface EventReference {
  readonly id: string;
  /** @deprecated Use id. */
  readonly key: string;
}

export interface AgentVersion {
  readonly current: string;
  readonly sourceVersion: string;
}

export interface Dependencies {
  readonly tools: readonly string[];
  readonly permissions: readonly string[];
  readonly agents: readonly string[];
}

export interface RegistryMetadata {
  readonly schemaVersion: "2";
  readonly source: string;
  readonly authoritative: true;
}

export interface MetadataOwner {
  readonly id: string;
  readonly displayName: string;
}

export interface ExecutionTimeEstimate {
  readonly value: number | null;
  readonly unit: "seconds" | "minutes";
  readonly confidence: "unknown" | "estimated";
}

export interface OperationalCostEstimate {
  readonly amount: number | null;
  readonly currency: "USD";
  readonly basis: "unknown" | "per_execution";
}

export interface DocumentationReference {
  readonly summary: string;
  readonly sourcePaths: readonly string[];
}

export interface Agent extends RegistryEntry {
  readonly id: string;
  readonly displayName: string;
  readonly key: string;
  readonly label: string;
  readonly mission: string;
  readonly responsibilities: readonly string[];
  readonly department: Department;
  readonly businessDomain: BusinessDomain;
  readonly primaryRole: string;
  readonly secondaryRoles: readonly string[];
  readonly businessOutcome: string;
  readonly businessOutcomeId: string;
  readonly businessObjectives: readonly string[];
  readonly businessObjectiveIds: readonly string[];
  readonly coreResponsibilities: readonly string[];
  readonly primaryKPIs: readonly string[];
  readonly secondaryKPIs: readonly string[];
  readonly priority: AgentPriority;
  readonly owner: MetadataOwner;
  readonly supportedIndustries: readonly string[];
  readonly supportedBusinessSizes: readonly BusinessSize[];
  readonly supportedChannels: readonly string[];
  readonly executionMode: readonly ExecutionMode[];
  readonly activationConditions: readonly string[];
  readonly capabilities: readonly Capability[];
  readonly requiredCapabilities: readonly Capability[];
  readonly skills: readonly Skill[];
  readonly workflows: readonly WorkflowReference[];
  readonly triggers: readonly Trigger[];
  readonly automations: readonly Automation[];
  readonly notificationChannels: readonly NotificationChannel[];
  readonly businessDomains: readonly BusinessDomain[];
  readonly executionModes: readonly ExecutionMode[];
  readonly estimatedExecutionTime: ExecutionTimeEstimate;
  readonly estimatedOperationalCost: OperationalCostEstimate;
  readonly escalationTargets: readonly string[];
  readonly documentation: DocumentationReference;
  readonly lifecycle: Lifecycle;
  readonly dependencies: Dependencies;
  readonly health: HealthStatus;
  readonly version: AgentVersion;
  readonly status: AgentStatus;
  readonly registrationState: RegistrationState;
  readonly deploymentState: DeploymentState;
  readonly tags: readonly string[];
  readonly prompts: readonly PromptReference[];
  readonly events: readonly EventReference[];
  readonly registry: RegistryMetadata;
}

export interface AgentRegistry {
  list(): readonly Agent[];
  get(key: string): Agent | undefined;
}

const entries = new Map<string, Agent>();

/**
 * Declarative agent metadata only. This registry does not instantiate,
 * schedule, orchestrate, or execute agents.
 */
export const agentRegistry: AgentRegistry = {
  list: () => Object.freeze(Array.from(entries.values())),
  get: (key) => entries.get(key),
};

/** @internal Capability packs are the only registry writers. */
export function registerAgent(agent: Agent): void {
  if (entries.has(agent.key)) {
    throw new Error(`Agent registry entry already exists for key "${agent.key}"`);
  }
  entries.set(agent.key, Object.freeze(agent));
}
