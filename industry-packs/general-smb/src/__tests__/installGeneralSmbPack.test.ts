import { beforeAll, describe, expect, it } from "vitest";
import {
  capabilityRegistry,
  capabilityPackRegistry,
  constraintRegistry,
  dashboardRegistry,
  dependencyGraph,
  eventRegistry,
  featureRegistry,
  governanceRegistry,
  kpiRegistry,
  lifecycleRegistry,
  marketplaceRegistry,
  orchestratorRegistry,
  ownershipMatrix,
  policyRegistry,
  registryCertification,
  runtimeRegistry,
  auditMetadata,
  aiEmployeeRegistry,
  agentRegistry,
  automationRegistry,
  businessRelationshipRegistry,
  semanticViewRegistry,
  businessQueryRegistry,
  triggerRegistry,
  workflowRegistry,
  promptRegistry,
} from "@boss/registries";
import { installGeneralSmbPack } from "../index.js";

describe("installGeneralSmbPack", () => {
  beforeAll(() => {
    installGeneralSmbPack();
  });

  it("registers all capabilities", () => {
    expect(capabilityRegistry.list().length).toBeGreaterThanOrEqual(15);
  });

  it("registers all constraints with valid capability references", () => {
    const capabilityKeys = new Set(capabilityRegistry.list().map((c) => c.key));
    for (const constraint of constraintRegistry.list()) {
      for (const capabilityKey of constraint.relatedCapabilities) {
        expect(capabilityKeys.has(capabilityKey)).toBe(true);
      }
    }
  });

  it("registers KPIs", () => {
    expect(kpiRegistry.list().length).toBeGreaterThanOrEqual(10);
  });

  it("registers AI employees with valid KPI references", () => {
    const kpiKeys = new Set(kpiRegistry.list().map((k) => k.key));
    for (const employee of aiEmployeeRegistry.list()) {
      for (const kpiKey of employee.kpis) {
        expect(kpiKeys.has(kpiKey)).toBe(true);
      }
    }
  });

  it("registers workflows with valid constraint references", () => {
    const constraintKeys = new Set(constraintRegistry.list().map((c) => c.key));
    for (const workflow of workflowRegistry.list()) {
      for (const constraintKey of workflow.relatedConstraints) {
        expect(constraintKeys.has(constraintKey)).toBe(true);
      }
    }
  });

  it("registers a prompt for every AI employee", () => {
    for (const employee of aiEmployeeRegistry.list()) {
      expect(promptRegistry.get(`${employee.key}.system`)).toBeDefined();
    }
  });

  it("registers each existing AI employee exactly once in the agent registry", () => {
    const employees = aiEmployeeRegistry.list();
    const agents = agentRegistry.list();

    expect(agents).toHaveLength(employees.length);
    expect(new Set(agents.map((agent) => agent.key)).size).toBe(agents.length);

    for (const employee of employees) {
      const agent = agentRegistry.get(employee.key);
      expect(agent?.label).toBe(employee.label);
      expect(agent?.health).toBe("not_registered");
      expect(agent?.prompts.some((prompt) => prompt.id === `${employee.key}.system`)).toBe(true);
    }
  });

  it("uses only existing prompt, workflow, event, and trigger references", () => {
    const workflowKeys = new Set(workflowRegistry.list().map((workflow) => workflow.key));
    const promptKeys = new Set(promptRegistry.list().map((prompt) => prompt.key));
    const eventKeys = new Set(["agent.created", "agent.started", "agent.completed"]);
    const triggerKeys = new Set(["manual", "event", "schedule"]);

    for (const agent of agentRegistry.list()) {
      expect(agent.automations).toEqual([]);
      for (const prompt of agent.prompts) {
        expect(promptKeys.has(prompt.key)).toBe(true);
      }
      for (const workflow of agent.workflows) {
        expect(workflowKeys.has(workflow.key)).toBe(true);
      }
      for (const event of agent.events) {
        expect(eventKeys.has(event.key)).toBe(true);
      }
      for (const trigger of agent.triggers) {
        expect(triggerKeys.has(trigger.key)).toBe(true);
      }
    }
  });

  it("provides complete, normalized SMB metadata for every agent", () => {
    const allowedDepartments = new Set([
      "executive",
      "operations",
      "sales",
      "marketing",
      "finance",
      "customer_success",
      "support",
      "compliance",
      "analytics",
      "administration",
      "knowledge",
      "automation",
    ]);

    for (const agent of agentRegistry.list()) {
      expect(agent.id).toBe(agent.key);
      expect(agent.displayName).toBe(agent.label);
      expect(allowedDepartments.has(agent.department.id)).toBe(true);
      expect(agent.owner.id).not.toHaveLength(0);
      expect(agent.businessDomain.id).not.toHaveLength(0);
      expect(agent.primaryRole).not.toHaveLength(0);
      expect(agent.businessOutcome).not.toHaveLength(0);
      expect(agent.coreResponsibilities.length).toBeGreaterThan(0);
      expect(agent.primaryKPIs.length).toBeGreaterThan(0);
      expect(agent.lifecycle).not.toHaveLength(0);
      expect(agent.registrationState).toBe("registered");
      expect(agent.deploymentState).toBe("not_deployed");
      expect(agent.registry.schemaVersion).toBe("2");
      expect(new Set(agent.tags).size).toBe(agent.tags.length);
      expect(agent.dependencies.agents).not.toContain(agent.id);
    }
  });

  it("keeps the agent registry readonly and free of duplicate metadata", () => {
    const agents = agentRegistry.list();
    expect(Object.isFrozen(agents)).toBe(true);
    expect(agents.every((agent) => Object.isFrozen(agent))).toBe(true);
    expect(new Set(agents.map((agent) => agent.id)).size).toBe(agents.length);
    expect(new Set(agents.map((agent) => agent.displayName)).size).toBe(agents.length);
  });

  it("registers a normalized, readonly, unique capability catalog", () => {
    const capabilities = capabilityRegistry.list();

    expect(Object.isFrozen(capabilities)).toBe(true);
    expect(capabilities.every((capability) => Object.isFrozen(capability))).toBe(true);
    expect(new Set(capabilities.map((capability) => capability.id)).size).toBe(capabilities.length);
    expect(new Set(capabilities.map((capability) => capability.name)).size).toBe(capabilities.length);
    expect(capabilities.every((capability) => capability.owner.length > 0)).toBe(true);
    expect(capabilities.every((capability) => capability.version === "1.0.0")).toBe(true);
    expect(capabilities.every((capability) => capability.status === "active")).toBe(true);
  });

  it("maps every agent capability ID to one normalized capability", () => {
    const capabilityIds = new Set(capabilityRegistry.list().map((capability) => capability.id));

    for (const agent of agentRegistry.list()) {
      expect(agent.requiredCapabilities).toEqual(agent.capabilities);
      for (const capability of agent.requiredCapabilities) {
        expect(capabilityIds.has(capability.id)).toBe(true);
      }
    }
  });

  it("has valid, acyclic capability dependencies", () => {
    const capabilities = capabilityRegistry.list();
    const capabilityIds = new Set(capabilities.map((capability) => capability.id));

    for (const capability of capabilities) {
      expect(capability.dependencies).not.toContain(capability.id);
      for (const dependencyId of capability.dependencies) {
        expect(capabilityIds.has(dependencyId)).toBe(true);
        expect(capabilityRegistry.get(dependencyId)?.dependencies).not.toContain(capability.id);
      }
    }
  });

  it("reports capabilities currently unmapped to agents", () => {
    const mappedIds = new Set(
      agentRegistry
        .list()
        .flatMap((agent) => agent.requiredCapabilities.map((capability) => capability.id)),
    );
    const unmappedIds = capabilityRegistry
      .list()
      .map((capability) => capability.id)
      .filter((id) => !mappedIds.has(id))
      .sort();

    expect(unmappedIds).toEqual([
      "customer_management",
      "documents",
      "marketing",
      "notifications",
      "sales",
      "team_collaboration",
    ]);
  });

  it("registers readonly execution registries without inventing runtime definitions", () => {
    expect(workflowRegistry.list()).toHaveLength(6);
    expect(eventRegistry.list()).toHaveLength(53);
    expect(triggerRegistry.list()).toHaveLength(3);
    expect(automationRegistry.list()).toHaveLength(0);
    expect(orchestratorRegistry.list()).toHaveLength(0);

    for (const registry of [
      workflowRegistry,
      eventRegistry,
      triggerRegistry,
      automationRegistry,
      orchestratorRegistry,
      capabilityPackRegistry,
      marketplaceRegistry,
    ]) {
      expect(Object.isFrozen(registry.list())).toBe(true);
      expect(registry.list().every((entry) => Object.isFrozen(entry))).toBe(true);
    }
  });

  it("resolves every workflow execution reference", () => {
    const agentIds = new Set(agentRegistry.list().map((entry) => entry.id));
    const capabilityIds = new Set(capabilityRegistry.list().map((entry) => entry.id));
    const promptIds = new Set(promptRegistry.list().map((entry) => entry.key));
    const eventIds = new Set(eventRegistry.list().map((entry) => entry.id));
    const triggerIds = new Set<string>(triggerRegistry.list().map((entry) => entry.id));

    for (const workflow of workflowRegistry.list()) {
      expect(workflow.owner).not.toHaveLength(0);
      expect(workflow.agentIds.every((id) => agentIds.has(id))).toBe(true);
      expect(workflow.capabilityIds.every((id) => capabilityIds.has(id))).toBe(true);
      expect(workflow.promptIds.every((id) => promptIds.has(id))).toBe(true);
      expect(workflow.eventIds.every((id) => eventIds.has(id))).toBe(true);
      expect(workflow.triggerIds.every((id) => triggerIds.has(id))).toBe(true);
      expect(workflow.automationIds).toEqual([]);
    }
  });

  it("builds an integral graph, indexes, and read-only impact models", () => {
    const graph = dependencyGraph.snapshot();
    expect(graph.nodes).toHaveLength(130);
    expect(graph.edges).toHaveLength(109);
    expect(graph.health.duplicateNodeIds).toEqual([]);
    expect(graph.health.brokenReferences).toEqual([]);
    expect(graph.health.cyclicReferences).toEqual([]);
    expect(graph.health.unusedPromptIds).toEqual([]);
    expect(graph.health.missingOwnerNodeIds).toEqual([]);
    expect(graph.health.orphanNodeIds).toHaveLength(59);
    expect(graph.health.emptyRegistryIds).toEqual(
      expect.arrayContaining(["automation", "notification", "integration", "orchestrator"]),
    );
    expect(graph.indexes.agentToWorkflow.ceo_advisor).toContain("administrative_automation");
    expect(graph.indexes.workflowToTriggers.invoice_follow_up).toEqual(["schedule"]);
    expect(graph.indexes.workflowToAutomations.invoice_follow_up).toEqual([]);

    const impact = dependencyGraph.impact.agent("ceo_advisor");
    expect(impact.downstream).toContainEqual({
      registry: "workflow",
      id: "administrative_automation",
    });
    expect(impact.upstream).toContainEqual({
      registry: "department",
      id: "executive",
    });
  });

  it("registers governance, lifecycle, ownership, and audit metadata", () => {
    expect(policyRegistry.list()).toHaveLength(11);
    expect(governanceRegistry.list()).toHaveLength(4);
    expect(lifecycleRegistry.list()).toHaveLength(15);
    expect(ownershipMatrix.list().length).toBeGreaterThan(70);
    expect(ownershipMatrix.list().every((entry) => entry.owner.length > 0)).toBe(true);
    expect(auditMetadata.requiredEvidence).toEqual([
      "typecheck",
      "lint",
      "affected_tests",
      "build",
    ]);
  });

  it("produces an evidence-based conditional certification decision", () => {
    const certification = registryCertification.snapshot();
    expect(certification.checks.every((check) => check.passed)).toBe(true);
    expect(certification.industryPacks).toContainEqual(
      expect.objectContaining({
        id: "general-smb",
        compatible: true,
      }),
    );
    expect(certification.decision).toBe("CONDITIONAL_GO");
    expect(
      certification.scores.find((entry) => entry.area === "Execution")?.score,
    ).toBe(60);
  });

  it("registers implemented platform features and dashboards without fabricating a runtime", () => {
    expect(featureRegistry.list().map((entry) => entry.id)).toEqual([
      "capability_pack_platform",
      "business_knowledge_graph",
      "business_semantic_layer",
      "business_query_insight_layer",
      "canonical_business_discovery",
      "business_intelligence",
      "executive_command_center",
      "registry_architecture",
    ]);
    expect(dashboardRegistry.get("executive_command_center")).toEqual(
      expect.objectContaining({
        route: "/",
        status: "internal_alpha",
      }),
    );
    expect(runtimeRegistry.list()).toHaveLength(27);
    expect(runtimeRegistry.get("business_context_runtime")).toEqual(
      expect.objectContaining({
        kind: "discovery",
        implementationPackage: "@boss/api",
        status: "internal_alpha",
      }),
    );
    expect(
      policyRegistry.get("execution.business_context_required"),
    ).toEqual(
      expect.objectContaining({
        category: "execution",
        riskLevel: "high",
      }),
    );
    for (const eventId of [
      "business.discovery.created",
      "business.discovery.updated",
      "business.discovery.validated",
      "business.context.published",
    ]) {
      expect(eventRegistry.get(eventId)).toBeDefined();
    }
    expect(runtimeRegistry.get("workflow_runtime")).toEqual(
      expect.objectContaining({
        implementationPackage: "@boss/loop",
        status: "internal_alpha",
      }),
    );
    expect(businessRelationshipRegistry.list()).toHaveLength(11);
    expect(businessRelationshipRegistry.get("depends_on")).toEqual(
      expect.objectContaining({
        version: "1.0.0",
        status: "active",
      }),
    );
    for (const runtimeId of [
      "business_knowledge_graph",
      "business_graph_repository",
      "graph_resolution_engine",
      "graph_runtime",
      "graph_traversal_service",
      "graph_validation_service",
      "graph_cache",
    ]) {
      expect(runtimeRegistry.get(runtimeId)).toEqual(
        expect.objectContaining({ kind: "graph" }),
      );
    }
    for (const eventId of [
      "business.graph.created",
      "business.graph.versioned",
      "business.graph.loaded",
      "business.graph.traversed",
      "business.graph.validated",
      "business.graph.cache.refreshed",
    ]) {
      expect(eventRegistry.get(eventId)).toBeDefined();
    }
    expect(semanticViewRegistry.list()).toHaveLength(8);
    expect(Object.isFrozen(semanticViewRegistry.list())).toBe(true);
    for (const view of semanticViewRegistry.list()) {
      expect(view.entityTypes.length).toBeGreaterThan(0);
      expect(view.version).toBe("1.0.0");
      expect(view.status).toBe("active");
    }
    for (const runtimeId of [
      "business_semantic_layer",
      "context_resolution_service",
      "semantic_view_registry",
      "dependency_resolution_service",
    ]) {
      expect(runtimeRegistry.get(runtimeId)).toEqual(
        expect.objectContaining({ kind: "semantic" }),
      );
    }
    for (const eventId of [
      "business.semantic.loaded",
      "business.context.resolved",
      "business.semantic.view.created",
      "business.semantic.updated",
    ]) {
      expect(eventRegistry.get(eventId)).toBeDefined();
    }
    expect(policyRegistry.get("execution.semantic_context_required")).toEqual(
      expect.objectContaining({
        category: "execution",
        riskLevel: "high",
      }),
    );
    expect(businessQueryRegistry.list()).toHaveLength(14);
    expect(Object.isFrozen(businessQueryRegistry.list())).toBe(true);
    expect(
      new Set(businessQueryRegistry.list().map((entry) => entry.id)).size,
    ).toBe(14);
    for (const runtimeId of [
      "business_query_service",
      "projection_engine",
      "business_insight_service",
      "query_catalog",
    ]) {
      expect(runtimeRegistry.get(runtimeId)).toEqual(
        expect.objectContaining({ kind: "query" }),
      );
    }
    for (const eventId of [
      "business.query.executed",
      "business.view.generated",
      "business.projection.generated",
      "business.insight.generated",
    ]) {
      expect(eventRegistry.get(eventId)).toBeDefined();
    }
    expect(policyRegistry.get("execution.business_query_required")).toEqual(
      expect.objectContaining({
        category: "execution",
        riskLevel: "high",
      }),
    );
  });
});
