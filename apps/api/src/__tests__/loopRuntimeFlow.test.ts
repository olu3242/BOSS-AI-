import { describe, expect, it } from "vitest";
import { createInMemoryEventBus } from "@boss/events";
import { createLoopRuntime, createTaskHandlerRegistry } from "@boss/loop";
import { createInMemoryContainer } from "../container.js";
import { createBusinessProfileService } from "../services/businessProfileService.js";
import { createToolFabricService } from "../services/toolFabricService.js";
import { createLoopRuntimeService } from "../services/loopRuntimeService.js";

const ORG_ID = "55555555-5555-5555-5555-555555555555";

async function createTestBusiness(repos: ReturnType<typeof createInMemoryContainer>) {
  const profileService = createBusinessProfileService(repos);
  const { business } = await profileService.createBusiness({
    orgId: ORG_ID,
    name: "Loop Test Co",
    industry: "plumbing",
    employeeCount: 4,
    annualRevenue: 250000,
    businessType: "plumbing",
    yearsOperating: 2,
    locationCount: 1,
    businessHours: "Mon-Fri 8am-5pm",
  });
  return business;
}

describe("loop runtime flow", () => {
  it("executes a multi-step workflow end-to-end and emits canonical events", async () => {
    const repos = createInMemoryContainer();
    const business = await createTestBusiness(repos);
    const eventBus = createInMemoryEventBus();
    const seen: string[] = [];
    eventBus.subscribe("execution.created", (e) => seen.push(e.type));
    eventBus.subscribe("execution.started", (e) => seen.push(e.type));
    eventBus.subscribe("task.completed", (e) => seen.push(e.type));
    eventBus.subscribe("execution.completed", (e) => seen.push(e.type));

    const handlers = createTaskHandlerRegistry();
    handlers.register("manual", async (input) => ({ output: { echoed: input }, errorMessage: null }));

    const runtime = createLoopRuntime(
      {
        workflowExecutions: repos.workflowExecutions,
        taskExecutions: repos.taskExecutions,
        executionEvents: repos.executionEvents,
        deadLetters: repos.deadLetters,
      },
      handlers,
      eventBus
    );

    const execution = await runtime.execute(ORG_ID, business.id, "test_workflow", [
      { stepKey: "step_1", taskType: "manual", input: { foo: "bar" } },
      { stepKey: "step_2", taskType: "manual", input: { baz: "qux" } },
    ]);

    expect(execution.state).toBe("completed");
    expect(execution.currentStepIndex).toBe(2);
    expect(seen).toEqual(["execution.created", "execution.started", "task.completed", "task.completed", "execution.completed"]);
  });

  it("retries a failing task until it succeeds, then completes", async () => {
    const repos = createInMemoryContainer();
    const business = await createTestBusiness(repos);
    const eventBus = createInMemoryEventBus();

    let attempts = 0;
    const handlers = createTaskHandlerRegistry();
    handlers.register("manual", async () => {
      attempts += 1;
      if (attempts < 2) {
        return { output: null, errorMessage: "transient failure" };
      }
      return { output: { ok: true }, errorMessage: null };
    });

    const runtime = createLoopRuntime(
      {
        workflowExecutions: repos.workflowExecutions,
        taskExecutions: repos.taskExecutions,
        executionEvents: repos.executionEvents,
        deadLetters: repos.deadLetters,
      },
      handlers,
      eventBus
    );

    const execution = await runtime.execute(ORG_ID, business.id, "retry_workflow", [
      { stepKey: "step_1", taskType: "manual", input: {}, maxRetries: 2 },
    ]);

    expect(execution.state).toBe("completed");
    expect(attempts).toBe(2);

    const deadLetters = await repos.deadLetters.listByBusinessId(ORG_ID, business.id);
    expect(deadLetters.length).toBe(0);
  });

  it("rolls back completed steps and dead-letters the failed task when retries are exhausted", async () => {
    const repos = createInMemoryContainer();
    const business = await createTestBusiness(repos);
    const eventBus = createInMemoryEventBus();

    const compensated: string[] = [];
    const handlers = createTaskHandlerRegistry();
    handlers.register("manual", async () => ({ output: { ok: true }, errorMessage: null }));
    handlers.register("tool", async () => ({ output: null, errorMessage: "permanent failure" }));
    handlers.register("scheduled", async (input) => {
      compensated.push(String(input.stepKey ?? "compensated"));
      return { output: null, errorMessage: null };
    });

    const runtime = createLoopRuntime(
      {
        workflowExecutions: repos.workflowExecutions,
        taskExecutions: repos.taskExecutions,
        executionEvents: repos.executionEvents,
        deadLetters: repos.deadLetters,
      },
      handlers,
      eventBus
    );

    const execution = await runtime.execute(ORG_ID, business.id, "failing_workflow", [
      { stepKey: "step_1", taskType: "manual", input: { stepKey: "step_1" }, compensationTaskType: "scheduled" },
      { stepKey: "step_2", taskType: "tool", input: {}, maxRetries: 1 },
    ]);

    expect(execution.state).toBe("failed");
    expect(execution.errorMessage).toBe("permanent failure");
    expect(compensated).toEqual(["step_1"]);

    const deadLetters = await repos.deadLetters.listByBusinessId(ORG_ID, business.id);
    expect(deadLetters.length).toBe(1);
    expect(deadLetters[0]?.stepKey).toBe("step_2");
  });

  it("wires the tool task handler to the tool fabric service via loopRuntimeService", async () => {
    const repos = createInMemoryContainer();
    const business = await createTestBusiness(repos);
    const toolFabric = createToolFabricService(repos);

    await toolFabric.connectIntegration(ORG_ID, business.id, "smtp");
    await toolFabric.setPermission(ORG_ID, business.id, {
      toolKey: "tool_send_email",
      roleKey: "ai_follow_up_assistant",
      allowed: true,
      approval: "auto",
      rateLimitPerMinute: null,
    });

    const loopRuntime = createLoopRuntimeService(repos, toolFabric);

    const execution = await loopRuntime.execute(ORG_ID, business.id, "send_followup_email", [
      {
        stepKey: "send_email",
        taskType: "tool",
        input: {
          orgId: ORG_ID,
          businessId: business.id,
          capabilityKey: "send_email",
          roleKey: "ai_follow_up_assistant",
          requestedBy: "ai_follow_up_assistant",
          to: "customer@example.com",
          subject: "Following up",
          body: "Just checking in!",
        },
      },
    ]);

    expect(execution.state).toBe("completed");

    const toolExecutions = await toolFabric.listExecutions(ORG_ID, business.id);
    expect(toolExecutions.length).toBe(1);
    expect(toolExecutions[0]?.status).toBe("succeeded");
  });
});
