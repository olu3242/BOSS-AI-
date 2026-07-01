import { governanceRegistry } from "../registries/governance.js";
import { lifecycleRegistry } from "../registries/lifecycle.js";

const lifecycleEntries = [
  ["agent.draft", "Agent Draft", "agent", "draft", false, ["agent.available", "agent.disabled"]],
  ["agent.available", "Agent Available", "agent", "available", false, ["agent.deprecated", "agent.disabled"]],
  ["agent.deprecated", "Agent Deprecated", "agent", "deprecated", true, []],
  ["agent.disabled", "Agent Disabled", "agent", "disabled", true, []],
  ["capability.active", "Capability Active", "capability", "active", false, ["capability.deprecated", "capability.disabled"]],
  ["capability.deprecated", "Capability Deprecated", "capability", "deprecated", true, []],
  ["capability.disabled", "Capability Disabled", "capability", "disabled", true, []],
  ["workflow.draft", "Workflow Draft", "workflow", "draft", false, ["workflow.active", "workflow.disabled"]],
  ["workflow.active", "Workflow Active", "workflow", "active", false, ["workflow.deprecated", "workflow.disabled"]],
  ["workflow.deprecated", "Workflow Deprecated", "workflow", "deprecated", true, []],
  ["workflow.disabled", "Workflow Disabled", "workflow", "disabled", true, []],
  ["registry.registered", "Registry Registered", "registry", "registered", false, ["registry.deprecated"]],
  ["registry.deprecated", "Registry Deprecated", "registry", "deprecated", true, []],
  ["policy.active", "Policy Active", "policy", "active", false, ["policy.deprecated"]],
  ["policy.deprecated", "Policy Deprecated", "policy", "deprecated", true, []],
] as const;

const governanceEntries = [
  {
    id: "registry.change_control",
    displayName: "Registry Change Control",
    description: "Registry changes require review, validation evidence, and versioned documentation.",
    scopeRegistryIds: ["agent", "capability", "workflow", "event", "trigger", "automation", "orchestrator"],
    policyIds: ["approval.workflow_execution"],
    owner: "Governance",
    approval: "human_required" as const,
    riskLevel: "high" as const,
  },
  {
    id: "registry.reference_integrity",
    displayName: "Registry Reference Integrity",
    description: "All cross-registry references must resolve to stable IDs.",
    scopeRegistryIds: ["agent", "capability", "workflow", "event", "trigger", "automation", "orchestrator"],
    policyIds: ["security.tenant_isolation"],
    owner: "Platform",
    approval: "human_required" as const,
    riskLevel: "high" as const,
  },
  {
    id: "registry.ownership",
    displayName: "Registry Ownership",
    description: "Every governed registry record must identify an accountable owner.",
    scopeRegistryIds: ["agent", "capability", "workflow", "event", "trigger", "policy"],
    policyIds: ["escalation.owner_notification"],
    owner: "Governance",
    approval: "human_required" as const,
    riskLevel: "medium" as const,
  },
  {
    id: "registry.lifecycle",
    displayName: "Registry Lifecycle",
    description: "Governed definitions use declared lifecycle states and transitions.",
    scopeRegistryIds: ["agent", "capability", "workflow", "policy"],
    policyIds: ["approval.workflow_execution"],
    owner: "Governance",
    approval: "human_required" as const,
    riskLevel: "medium" as const,
  },
] as const;

export function seedLifecycleRegistry(): void {
  for (const [id, displayName, entityType, state, terminal, allowedNextStateIds] of lifecycleEntries) {
    lifecycleRegistry.register({
      id,
      displayName,
      key: id,
      label: displayName,
      entityType,
      state,
      terminal,
      allowedNextStateIds,
      owner: "Governance",
      documentation: "packages/registries/src/seed/governance.ts",
      version: "1.0.0",
    });
  }
}

export function seedGovernanceRegistry(): void {
  for (const entry of governanceEntries) {
    governanceRegistry.register({
      ...entry,
      key: entry.id,
      label: entry.displayName,
      changeControl: "pull_request",
      lifecycleId: "registry.registered",
      documentation: "packages/registries/src/seed/governance.ts",
      version: "1.0.0",
      status: "active",
    });
  }
}
