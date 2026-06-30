import { describe, expect, it, vi, beforeAll } from "vitest";
import { aiEmployeeRegistry } from "@boss/registries";
import { planMultiAgentTask, reflectOnOutcomes } from "@boss/mcp";
import { createInMemoryContainer } from "../container.js";
import { createLoopRuntimeService } from "../services/loopRuntimeService.js";
import { createMultiAgentRuntimeService } from "../services/multiAgentRuntimeService.js";
import type { ToolFabricService } from "../services/toolFabricService.js";

const ORG_ID = "org-multi-agent-test";
const BIZ_ID = "biz-multi-agent-test";

// Register two test employees in "available" lifecycle for this test suite
beforeAll(() => {
  if (!aiEmployeeRegistry.get("test_comms_agent")) {
    aiEmployeeRegistry.register({
      key: "test_comms_agent",
      label: "Test Comms Agent",
      mission: "Handle communications",
      responsibilities: ["Send messages"],
      capabilities: ["send_sms", "send_email"],
      requiredTools: [],
      kpis: [],
      permissions: [],
      escalationRules: [],
      lifecycle: "available",
    });
  }
  if (!aiEmployeeRegistry.get("test_email_agent")) {
    aiEmployeeRegistry.register({
      key: "test_email_agent",
      label: "Test Email Agent",
      mission: "Send emails",
      responsibilities: ["Email campaigns"],
      capabilities: ["send_email"],
      requiredTools: [],
      kpis: [],
      permissions: [],
      escalationRules: [],
      lifecycle: "available",
    });
  }
});

function makeToolFabric(): ToolFabricService {
  return {
    requestTool: vi.fn().mockResolvedValue({ id: "exec-1", output: { sent: true }, errorMessage: null }),
    connectIntegration: vi.fn(),
    listIntegrations: vi.fn().mockResolvedValue([]),
    getProviderHealth: vi.fn().mockResolvedValue([]),
    getAuditLog: vi.fn().mockResolvedValue([]),
  } as unknown as ToolFabricService;
}

describe("MultiAgentPlanner (MCP intelligence)", () => {
  it("returns empty plan when no available employees match", () => {
    const plan = planMultiAgentTask(
      { goal: "Send marketing blast", requiredCapabilities: ["send_sms"] },
      ["nonexistent_employee"]
    );
    expect(plan.steps).toHaveLength(0);
    expect(plan.reflectionRequired).toBe(false);
  });

  it("assigns available employees to matching capabilities", () => {
    const plan = planMultiAgentTask(
      { goal: "Communicate with customers", requiredCapabilities: ["send_sms"] },
      ["test_comms_agent"]
    );
    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.steps.every((s) => s.employeeKey === "test_comms_agent")).toBe(true);
    expect(plan.goal).toBe("Communicate with customers");
  });

  it("groups parallel steps when preferParallel is true and multiple employees share a capability", () => {
    const plan = planMultiAgentTask(
      { goal: "Send emails via multiple agents", requiredCapabilities: ["send_email"], preferParallel: true },
      ["test_comms_agent", "test_email_agent"]
    );
    const parallelSteps = plan.steps.filter((s) => s.parallel);
    expect(parallelSteps.length).toBeGreaterThan(0);
    expect(new Set(parallelSteps.map((s) => s.parallelGroupKey)).size).toBe(1);
  });

  it("marks reflectionRequired=true when plan has more than one step", () => {
    const plan = planMultiAgentTask(
      { goal: "Multi-step task", requiredCapabilities: [], preferParallel: false },
      ["test_comms_agent"]
    );
    // comms agent has 2 capabilities (send_sms + send_email), so 2 steps
    expect(plan.steps.length).toBeGreaterThanOrEqual(2);
    expect(plan.reflectionRequired).toBe(true);
  });
});

describe("MultiAgentReflection (MCP intelligence)", () => {
  it("marks achieved=true when all steps succeed", () => {
    const plan = planMultiAgentTask(
      { goal: "Send all", requiredCapabilities: ["send_sms"] },
      ["test_comms_agent"]
    );
    const outcomes = plan.steps.map((s) => ({
      stepKey: s.stepKey, employeeKey: s.employeeKey, capabilityKey: s.capabilityKey,
      succeeded: true, output: { ok: true }, errorMessage: null,
    }));
    const reflection = reflectOnOutcomes(plan, outcomes);
    expect(reflection.achieved).toBe(true);
    expect(reflection.successRate).toBe(1);
    expect(reflection.failedSteps).toHaveLength(0);
  });

  it("marks achieved=false and populates nextActions when success rate < 0.8", () => {
    const plan = planMultiAgentTask(
      { goal: "Risky task", requiredCapabilities: ["send_sms", "send_email"], preferParallel: false },
      ["test_comms_agent"]
    );
    const outcomes = plan.steps.map((s, i) => ({
      stepKey: s.stepKey, employeeKey: s.employeeKey, capabilityKey: s.capabilityKey,
      succeeded: i === 0, // only first succeeds
      output: null,
      errorMessage: i === 0 ? null : "Provider failed",
    }));
    const reflection = reflectOnOutcomes(plan, outcomes);
    expect(reflection.achieved).toBe(false);
    expect(reflection.nextActions.length).toBeGreaterThan(0);
    expect(reflection.failedSteps.length).toBeGreaterThan(0);
  });
});

describe("MultiAgentRuntimeService — end to end", () => {
  it("delegates task to loop runtime and returns plan + outcomes + reflection", async () => {
    const repos = createInMemoryContainer();
    const toolFabric = makeToolFabric();
    const loopRuntime = createLoopRuntimeService(repos, toolFabric);
    const multiAgent = createMultiAgentRuntimeService(repos, loopRuntime);

    const result = await multiAgent.delegateTask(
      ORG_ID, BIZ_ID,
      { goal: "Send SMS to customers", requiredCapabilities: ["send_sms"] },
      ["test_comms_agent"]
    );

    expect(result.workflowExecution.state).toBe("completed");
    expect(result.plan.goal).toBe("Send SMS to customers");
    expect(result.outcomes.length).toBeGreaterThan(0);
    // Single step => no reflection needed
    expect(result.reflection).toBeNull();
  });

  it("produces reflection when plan has multiple steps", async () => {
    const repos = createInMemoryContainer();
    const toolFabric = makeToolFabric();
    const loopRuntime = createLoopRuntimeService(repos, toolFabric);
    const multiAgent = createMultiAgentRuntimeService(repos, loopRuntime);

    // test_comms_agent has send_sms + send_email => 2 steps => reflectionRequired
    const result = await multiAgent.delegateTask(
      ORG_ID, BIZ_ID,
      { goal: "Full communications", requiredCapabilities: [] },
      ["test_comms_agent"]
    );

    expect(result.plan.reflectionRequired).toBe(true);
    expect(result.reflection).not.toBeNull();
    expect(typeof result.reflection?.successRate).toBe("number");
  });

  it("emits multi_agent domain events to the event bus", async () => {
    const repos = createInMemoryContainer();
    const toolFabric = makeToolFabric();
    const loopRuntime = createLoopRuntimeService(repos, toolFabric);
    const multiAgent = createMultiAgentRuntimeService(repos, loopRuntime);

    const emittedTypes: string[] = [];
    repos.eventBus.subscribe("multi_agent.plan.created", (e) => emittedTypes.push(e.type));
    repos.eventBus.subscribe("multi_agent.execution.completed", (e) => emittedTypes.push(e.type));

    await multiAgent.delegateTask(
      ORG_ID, BIZ_ID,
      { goal: "Event test", requiredCapabilities: ["send_sms"] },
      ["test_comms_agent"]
    );

    expect(emittedTypes).toContain("multi_agent.plan.created");
    expect(emittedTypes).toContain("multi_agent.execution.completed");
  });
});
