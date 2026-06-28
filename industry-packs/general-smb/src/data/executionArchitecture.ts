import {
  agentRegistry,
  automationRegistry,
  capabilityRegistry,
  eventRegistry,
  kpiRegistry,
  orchestratorRegistry,
  promptRegistry,
  registerExecutionArchitecture,
  triggerRegistry,
  workflowRegistry,
} from "@boss/registries";
import type {
  ExecutionReferenceIndexes,
  GraphEdge,
  GraphNode,
  GraphNodeReference,
} from "@boss/registries";

const ref = (
  registry: GraphNodeReference["registry"],
  id: string,
): GraphNodeReference => ({ registry, id });

const node = (
  registry: GraphNodeReference["registry"],
  id: string,
  displayName: string,
  owner: string,
  tags: readonly string[] = [],
): GraphNode => ({
  ref: ref(registry, id),
  displayName,
  owner,
  tags,
});

const edge = (
  from: GraphNodeReference,
  to: GraphNodeReference,
  relationship: string,
): GraphEdge => ({ from, to, relationship });

const toIndex = (
  entries: readonly [string, readonly string[]][],
): Readonly<Record<string, readonly string[]>> =>
  Object.freeze(Object.fromEntries(entries));

export function seedExecutionArchitecture(): void {
  const agents = agentRegistry.list();
  const capabilities = capabilityRegistry.list();
  const prompts = promptRegistry.list();
  const workflows = workflowRegistry.list();
  const automations = automationRegistry.list();
  const triggers = triggerRegistry.list();
  const events = eventRegistry.list();
  const kpis = kpiRegistry.list();
  const orchestrators = orchestratorRegistry.list();

  const departments = Array.from(
    new Map(agents.map((agent) => [agent.department.id, agent.department])).values(),
  );

  const nodes: GraphNode[] = [
    ...agents.map((agent) =>
      node("business_outcome", agent.businessOutcomeId, agent.businessOutcome, agent.owner.displayName),
    ),
    ...agents.flatMap((agent) =>
      agent.businessObjectiveIds.map((id, index) =>
        node("business_objective", id, agent.businessObjectives[index] ?? id, agent.owner.displayName),
      ),
    ),
    ...departments.map((department) =>
      node("department", department.id, department.displayName, department.displayName),
    ),
    ...agents.map((agent) =>
      node("agent", agent.id, agent.displayName, agent.owner.displayName, agent.tags),
    ),
    ...capabilities.map((capability) =>
      node("capability", capability.id, capability.displayName, capability.owner, capability.tags),
    ),
    ...prompts.map((prompt) => node("prompt", prompt.key, prompt.label, "Automation")),
    ...workflows.map((workflow) =>
      node("workflow", workflow.id, workflow.displayName, workflow.owner, workflow.tags),
    ),
    ...automations.map((automation) =>
      node("automation", automation.id, automation.displayName, automation.owner),
    ),
    ...triggers.map((trigger) =>
      node("trigger", trigger.id, trigger.displayName, trigger.owner),
    ),
    ...events.map((event) =>
      node("event", event.id, event.displayName, event.owner, event.tags),
    ),
    ...kpis.map((kpi) => node("kpi", kpi.key, kpi.label, kpi.owner)),
    ...orchestrators.map((orchestrator) =>
      node("orchestrator", orchestrator.id, orchestrator.displayName, orchestrator.owner),
    ),
  ];

  const edges: GraphEdge[] = [];
  for (const agent of agents) {
    for (const objectiveId of agent.businessObjectiveIds) {
      edges.push(
        edge(
          ref("business_outcome", agent.businessOutcomeId),
          ref("business_objective", objectiveId),
          "supported_by",
        ),
        edge(
          ref("business_objective", objectiveId),
          ref("department", agent.department.id),
          "owned_by",
        ),
      );
    }
    edges.push(
      edge(ref("department", agent.department.id), ref("agent", agent.id), "staffed_by"),
    );
    for (const capability of agent.requiredCapabilities) {
      edges.push(
        edge(ref("agent", agent.id), ref("capability", capability.id), "requires"),
      );
      for (const prompt of agent.prompts) {
        edges.push(
          edge(ref("capability", capability.id), ref("prompt", prompt.id), "informs"),
        );
      }
    }
    for (const prompt of agent.prompts) {
      for (const workflow of agent.workflows) {
        edges.push(
          edge(ref("prompt", prompt.id), ref("workflow", workflow.id), "supports"),
        );
      }
    }
    for (const kpiId of [...agent.primaryKPIs, ...agent.secondaryKPIs]) {
      edges.push(edge(ref("agent", agent.id), ref("kpi", kpiId), "measured_by"));
    }
  }

  for (const workflow of workflows) {
    for (const automationId of workflow.automationIds) {
      edges.push(
        edge(ref("workflow", workflow.id), ref("automation", automationId), "implemented_by"),
      );
    }
    for (const triggerId of workflow.triggerIds) {
      edges.push(edge(ref("workflow", workflow.id), ref("trigger", triggerId), "entered_by"));
    }
    for (const eventId of workflow.eventIds) {
      edges.push(edge(ref("workflow", workflow.id), ref("event", eventId), "emits"));
    }
    for (const kpiId of workflow.relatedKpis) {
      edges.push(edge(ref("workflow", workflow.id), ref("kpi", kpiId), "measured_by"));
    }
  }

  const indexes: ExecutionReferenceIndexes = {
    agentToWorkflow: toIndex(
      agents.map((agent) => [agent.id, agent.workflows.map((workflow) => workflow.id)]),
    ),
    agentToCapability: toIndex(
      agents.map((agent) => [
        agent.id,
        agent.requiredCapabilities.map((capability) => capability.id),
      ]),
    ),
    workflowToEvents: toIndex(
      workflows.map((workflow) => [workflow.id, workflow.eventIds]),
    ),
    workflowToAutomations: toIndex(
      workflows.map((workflow) => [workflow.id, workflow.automationIds]),
    ),
    workflowToTriggers: toIndex(
      workflows.map((workflow) => [workflow.id, workflow.triggerIds]),
    ),
    automationToNotifications: toIndex(
      automations.map((automation) => [
        automation.id,
        automation.notificationChannelIds,
      ]),
    ),
    eventToPublishers: toIndex(
      events.map((event) => [event.id, event.publisherIds]),
    ),
    eventToSubscribers: toIndex(
      events.map((event) => [event.id, event.subscriberIds]),
    ),
    departmentToAgents: toIndex(
      departments.map((department) => [
        department.id,
        agents
          .filter((agent) => agent.department.id === department.id)
          .map((agent) => agent.id),
      ]),
    ),
    integrationToWorkflows: {},
  };

  registerExecutionArchitecture(nodes, edges, indexes);
}
