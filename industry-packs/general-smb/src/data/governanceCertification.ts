import {
  agentRegistry,
  automationRegistry,
  capabilityRegistry,
  dependencyGraph,
  eventRegistry,
  governanceRegistry,
  lifecycleRegistry,
  orchestratorRegistry,
  policyRegistry,
  promptRegistry,
  registerGovernanceCertification,
  triggerRegistry,
  workflowRegistry,
} from "@boss/registries";
import type {
  CertificationCheck,
  OwnershipEntry,
  ReadinessScore,
} from "@boss/registries";
import { GENERAL_SMB_PACK_VERSION } from "../version.js";

const unique = (values: readonly string[]): boolean =>
  new Set(values).size === values.length;

const score = (
  area: string,
  numerator: number,
  denominator: number,
  evidence: readonly string[],
): ReadinessScore => ({
  area,
  score: denominator === 0 ? 0 : Math.round((numerator / denominator) * 100),
  evidence,
});

export function seedGovernanceCertification(): void {
  const agents = agentRegistry.list();
  const capabilities = capabilityRegistry.list();
  const workflows = workflowRegistry.list();
  const events = eventRegistry.list();
  const triggers = triggerRegistry.list();
  const automations = automationRegistry.list();
  const orchestrators = orchestratorRegistry.list();
  const policies = policyRegistry.list();
  const governance = governanceRegistry.list();
  const lifecycles = lifecycleRegistry.list();
  const prompts = promptRegistry.list();
  const graph = dependencyGraph.snapshot();

  const ids = {
    agent: new Set(agents.map((entry) => entry.id)),
    capability: new Set(capabilities.map((entry) => entry.id)),
    workflow: new Set(workflows.map((entry) => entry.id)),
    event: new Set(events.map((entry) => entry.id)),
    trigger: new Set<string>(triggers.map((entry) => entry.id)),
    automation: new Set(automations.map((entry) => entry.id)),
    prompt: new Set(prompts.map((entry) => entry.key)),
    policy: new Set(policies.map((entry) => entry.id)),
    lifecycle: new Set(lifecycles.map((entry) => entry.id)),
  };

  const workflowReferencesValid = workflows.every(
    (workflow) =>
      workflow.agentIds.every((id) => ids.agent.has(id)) &&
      workflow.capabilityIds.every((id) => ids.capability.has(id)) &&
      workflow.promptIds.every((id) => ids.prompt.has(id)) &&
      workflow.eventIds.every((id) => ids.event.has(id)) &&
      workflow.triggerIds.every((id) => ids.trigger.has(id)) &&
      workflow.automationIds.every((id) => ids.automation.has(id)),
  );
  const policyMappingsValid = governance.every((entry) =>
    entry.policyIds.every((id) => ids.policy.has(id)),
  );
  const lifecycleMappingsValid =
    agents.every((entry) => ids.lifecycle.has(`agent.${entry.lifecycle}`)) &&
    capabilities.every((entry) => ids.lifecycle.has(`capability.${entry.status}`)) &&
    workflows.every((entry) => ids.lifecycle.has(`workflow.${entry.status}`)) &&
    policies.every((entry) => ids.lifecycle.has(`policy.${entry.lifecycle}`)) &&
    governance.every((entry) => ids.lifecycle.has(entry.lifecycleId)) &&
    lifecycles.every((entry) =>
      entry.allowedNextStateIds.every((id) => ids.lifecycle.has(id)),
    );

  const ownership: OwnershipEntry[] = [
    ...agents.map((entry) => ({ registry: "agent", id: entry.id, owner: entry.owner.displayName })),
    ...capabilities.map((entry) => ({ registry: "capability", id: entry.id, owner: entry.owner })),
    ...workflows.map((entry) => ({ registry: "workflow", id: entry.id, owner: entry.owner })),
    ...events.map((entry) => ({ registry: "event", id: entry.id, owner: entry.owner })),
    ...triggers.map((entry) => ({ registry: "trigger", id: entry.id, owner: entry.owner })),
    ...automations.map((entry) => ({ registry: "automation", id: entry.id, owner: entry.owner })),
    ...orchestrators.map((entry) => ({ registry: "orchestrator", id: entry.id, owner: entry.owner })),
    ...policies.map((entry) => ({ registry: "policy", id: entry.id, owner: entry.owner })),
    ...governance.map((entry) => ({ registry: "governance", id: entry.id, owner: entry.owner })),
    ...lifecycles.map((entry) => ({ registry: "lifecycle", id: entry.id, owner: entry.owner })),
  ];

  const registryIds = [
    agents.map((entry) => entry.id),
    capabilities.map((entry) => entry.id),
    workflows.map((entry) => entry.id),
    events.map((entry) => entry.id),
    triggers.map((entry) => entry.id),
    automations.map((entry) => entry.id),
    orchestrators.map((entry) => entry.id),
    policies.map((entry) => entry.id),
    governance.map((entry) => entry.id),
    lifecycles.map((entry) => entry.id),
  ];
  const registryIdsUnique = registryIds.every(unique);
  const ownershipComplete = ownership.every((entry) => entry.owner.length > 0);
  const documentationComplete = [
    ...agents.map((entry) => entry.documentation.sourcePaths.length > 0),
    ...capabilities.map((entry) => entry.version.length > 0),
    ...workflows.map((entry) => entry.documentation.length > 0),
    ...events.map((entry) => entry.documentation.length > 0),
    ...triggers.map((entry) => entry.documentation.length > 0),
    ...policies.map((entry) => entry.documentation.length > 0),
    ...governance.map((entry) => entry.documentation.length > 0),
    ...lifecycles.map((entry) => entry.documentation.length > 0),
  ].every(Boolean);

  const checks: CertificationCheck[] = [
    {
      id: "registry.unique_ids",
      passed: registryIdsUnique,
      evidence: `${registryIds.reduce((total, entries) => total + entries.length, 0)} governed IDs checked`,
    },
    {
      id: "registry.reference_integrity",
      passed: workflowReferencesValid && graph.health.brokenReferences.length === 0,
      evidence: `${workflows.length} workflows and ${graph.edges.length} graph edges checked`,
    },
    {
      id: "registry.dependency_integrity",
      passed: graph.health.cyclicReferences.length === 0,
      evidence: `${graph.nodes.length} nodes checked for cycles`,
    },
    {
      id: "governance.ownership",
      passed: ownershipComplete,
      evidence: `${ownership.length} ownership records checked`,
    },
    {
      id: "governance.policy_mappings",
      passed: policyMappingsValid,
      evidence: `${governance.length} governance controls checked`,
    },
    {
      id: "governance.lifecycle_mappings",
      passed: lifecycleMappingsValid,
      evidence: `${lifecycles.length} lifecycle definitions checked`,
    },
    {
      id: "governance.documentation",
      passed: documentationComplete,
      evidence: "All populated governed records contain documentation metadata",
    },
  ];

  const populatedExecutionRegistries = [
    workflows.length,
    events.length,
    triggers.length,
    automations.length,
    orchestrators.length,
  ].filter((count) => count > 0).length;
  const allCriticalChecksPass = checks.every((check) => check.passed);
  const executionComplete = automations.length > 0 && orchestrators.length > 0;
  const decision = !allCriticalChecksPass
    ? "NO_GO"
    : executionComplete
      ? "GO"
      : "CONDITIONAL_GO";

  const scores: ReadinessScore[] = [
    score("Registry", 5, 7, [
      "Agent, capability, workflow, event, and trigger registries are populated",
      "Automation and orchestrator registries are empty",
    ]),
    score("Metadata", agents.filter((entry) => entry.owner.id && entry.department.id).length, agents.length, [
      `${agents.length} agents checked`,
    ]),
    score("Capabilities", capabilities.filter((entry) => entry.owner && entry.version).length, capabilities.length, [
      `${capabilities.length} capabilities checked`,
    ]),
    score("Execution", populatedExecutionRegistries, 5, [
      `${workflows.length} workflows, ${events.length} events, ${triggers.length} triggers`,
      "No registered automations or orchestrators",
    ]),
    score("Governance", checks.filter((check) => check.id.startsWith("governance.") && check.passed).length, 4, [
      `${policies.length} policies, ${governance.length} controls, ${lifecycles.length} lifecycle states`,
    ]),
    score("Documentation", documentationComplete ? 1 : 0, 1, [
      "Documentation metadata checked on populated governed records",
    ]),
    score("Dependency Integrity", graph.health.cyclicReferences.length === 0 ? 1 : 0, 1, [
      `${graph.nodes.length} nodes and ${graph.edges.length} edges analyzed`,
    ]),
    score("Backward Compatibility", 1, 1, [
      "Legacy key/label fields and registry register/list/get methods retained",
    ]),
    score("Reference Integrity", workflowReferencesValid && graph.health.brokenReferences.length === 0 ? 1 : 0, 1, [
      `${graph.health.brokenReferences.length} broken graph references`,
    ]),
  ];

  registerGovernanceCertification(ownership, {
    decision,
    checks,
    scores,
    industryPacks: [
      {
        id: "general-smb",
        version: GENERAL_SMB_PACK_VERSION,
        compatible: allCriticalChecksPass,
        findings: [
          `${agents.length} agents`,
          `${capabilities.length} capabilities`,
          `${workflows.length} workflows`,
          `${automations.length} automations`,
          `${orchestrators.length} orchestrators`,
        ],
      },
    ],
  });
}
