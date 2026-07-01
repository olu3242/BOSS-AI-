import { describe, expect, it } from "vitest";
import { InMemoryEventBus } from "@boss/events";
import type { Agent } from "@boss/registries";
import {
  AgentRuntime,
  BossRuntime,
  InMemoryAgentMemoryStore,
  InMemoryQueueRuntime,
  InMemoryRuntimeTelemetry,
  InMemorySchedulerRuntime,
  InMemoryWorkflowExecutionStore,
  WorkflowRuntime,
  type AgentModel,
} from "../index.js";

const context = {
  orgId: "org-1",
  businessId: "business-1",
  actorId: "user-1",
  requestId: "request-1",
  correlationId: "correlation-1",
  traceId: "trace-1",
};

const contextGuard = {
  assertReady: async () => undefined,
};

const workflowDefinitions = {
  get: (id: string) =>
    id === "administrative_automation" ? { id } : undefined,
};

const ceoAdvisor = {
  id: "ceo_advisor",
  dependencies: {
    tools: ["business_health_api"],
    permissions: [],
    agents: [],
  },
  prompts: [{ id: "ceo_advisor.system", key: "ceo_advisor.system", version: "1.0.0" }],
} as unknown as Agent;

describe("BOSS execution runtime", () => {
  it("fails closed when no canonical Business Context guard is configured", async () => {
    const runtime = new WorkflowRuntime(
      new InMemoryWorkflowExecutionStore(),
      new InMemoryEventBus(),
      new InMemoryRuntimeTelemetry(),
      workflowDefinitions,
    );

    await expect(
      runtime.execute(
        { id: "administrative_automation", steps: [] },
        "business-1",
        {},
        context,
      ),
    ).rejects.toThrow("requires a configured canonical Business Context guard");
  });

  it("executes registered workflows with approval and bounded retry", async () => {
    const telemetry = new InMemoryRuntimeTelemetry();
    const store = new InMemoryWorkflowExecutionStore();
    const runtime = new WorkflowRuntime(
      store,
      new InMemoryEventBus(),
      telemetry,
      workflowDefinitions,
      contextGuard,
    );
    let attempts = 0;

    const execution = await runtime.execute(
      {
        id: "administrative_automation",
        steps: [
          {
            id: "approval",
            kind: "approval",
            approve: async () => true,
            execute: async () => "approved",
          },
          {
            id: "perform",
            kind: "action",
            maximumAttempts: 2,
            execute: async () => {
              attempts += 1;
              if (attempts === 1) {
                throw new Error("temporary");
              }
              return "done";
            },
          },
        ],
      },
      "business-1",
      { task: "reconcile" },
      context,
    );

    expect(execution.state).toBe("completed");
    expect(execution.outputs).toEqual({
      approval: "approved",
      perform: "done",
    });
    expect(attempts).toBe(2);
    expect(telemetry.logs()).toContainEqual(
      expect.objectContaining({
        message: "Workflow step retry scheduled.",
      }),
    );
  });

  it("compensates completed workflow steps after a terminal failure", async () => {
    const compensated: string[] = [];
    const runtime = new WorkflowRuntime(
      new InMemoryWorkflowExecutionStore(),
      new InMemoryEventBus(),
      new InMemoryRuntimeTelemetry(),
      workflowDefinitions,
      contextGuard,
    );

    const execution = await runtime.execute(
      {
        id: "administrative_automation",
        steps: [
          {
            id: "reserve",
            kind: "action",
            execute: async () => "reserved",
            compensate: async () => {
              compensated.push("reserve");
            },
          },
          {
            id: "fail",
            kind: "action",
            execute: async () => {
              throw new Error("terminal");
            },
          },
        ],
      },
      "business-1",
      {},
      context,
    );

    expect(execution.state).toBe("compensated");
    expect(execution.error).toBe("terminal");
    expect(compensated).toEqual(["reserve"]);
  });

  it("retries, dead-letters, replays, and schedules queue work", async () => {
    const telemetry = new InMemoryRuntimeTelemetry();
    const queue = new InMemoryQueueRuntime(telemetry);
    const scheduler = new InMemorySchedulerRuntime();
    const scheduled = scheduler.schedule(
      "automation.execute",
      { automationId: "daily-report" },
      context,
      new Date("2026-01-01T00:00:00.000Z"),
      { maximumAttempts: 2 },
    );
    scheduler.runDue(new Date("2026-01-02T00:00:00.000Z"), queue);
    expect(scheduler.list()).not.toContainEqual(scheduled);

    await queue.runUntilIdle({
      "automation.execute": async () => {
        throw new Error("provider unavailable");
      },
    });
    expect(queue.deadLetters()).toHaveLength(1);

    const deadLetter = queue.deadLetters()[0];
    expect(deadLetter).toBeDefined();
    queue.replay(deadLetter!.id);
    await queue.runUntilIdle({
      "automation.execute": async () => undefined,
    });
    expect(queue.deadLetters()).toHaveLength(0);
    expect(queue.list()).toContainEqual(
      expect.objectContaining({ state: "completed" }),
    );
  });

  it("executes active agents with prompts, context, tools, memory, and health", async () => {
    const telemetry = new InMemoryRuntimeTelemetry();
    const eventBus = new InMemoryEventBus();
    const memory = new InMemoryAgentMemoryStore();
    const model: AgentModel = {
      execute: async (input) => ({
        promptCount: input.promptTemplates.length,
        health: input.toolResults.business_health_api,
      }),
    };
    const agentRuntime = new AgentRuntime(
      model,
      {
        retrieve: async () => ({ businessName: "Demo Business" }),
      },
      memory,
      new Map([
        [
          "business_health_api",
          {
            id: "business_health_api",
            invoke: async () => ({ score: 72 }),
          },
        ],
      ]),
      eventBus,
      telemetry,
      {
        agents: {
          get: (id) => (id === "ceo_advisor" ? ceoAdvisor : undefined),
        },
        prompts: {
          get: (id) =>
            id === "ceo_advisor.system"
              ? { template: "Provide the next best action." }
              : undefined,
        },
      },
      undefined,
      contextGuard,
    );
    const workflows = new WorkflowRuntime(
      new InMemoryWorkflowExecutionStore(),
      eventBus,
      telemetry,
      workflowDefinitions,
      contextGuard,
    );
    const boss = new BossRuntime(
      workflows,
      agentRuntime,
      new InMemoryQueueRuntime(telemetry),
      new InMemorySchedulerRuntime(),
      telemetry,
    );

    expect(boss.start(["ceo_advisor"]).state).toBe("running");
    const execution = await agentRuntime.execute(
      "ceo_advisor",
      { question: "What next?" },
      context,
      ["business_health_api"],
    );

    expect(execution.state).toBe("completed");
    expect(execution.output).toEqual({
      promptCount: 1,
      health: { score: 72 },
    });
    expect(await memory.get("org-1", "ceo_advisor")).toEqual({
      lastExecutionId: execution.id,
    });
    expect(boss.health().activeAgentExecutions).toBe(0);
    expect(boss.shutdown().state).toBe("stopped");
  });
});
