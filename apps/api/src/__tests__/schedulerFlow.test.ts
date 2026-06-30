import { describe, expect, it, vi } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createLoopRuntimeService } from "../services/loopRuntimeService.js";
import { createSchedulerService } from "../services/schedulerService.js";
import type { StepEntry, ParallelStepGroup } from "@boss/loop";
import type { ToolFabricService } from "../services/toolFabricService.js";

const ORG_ID = "org-scheduler-test";
const BIZ_ID = "biz-scheduler-test";
const WORKFLOW_KEY = "test.workflow";

function makeContainer() {
  return createInMemoryContainer();
}

function makeToolFabric(): ToolFabricService {
  return {
    requestTool: vi.fn().mockResolvedValue({ id: "exec-1", output: { ok: true }, errorMessage: null }),
    connectIntegration: vi.fn(),
    listIntegrations: vi.fn().mockResolvedValue([]),
    getProviderHealth: vi.fn().mockResolvedValue([]),
    getAuditLog: vi.fn().mockResolvedValue([]),
  } as unknown as ToolFabricService;
}

const simpleSteps: StepEntry[] = [
  { stepKey: "step-a", taskType: "tool", input: { orgId: ORG_ID, businessId: BIZ_ID, capabilityKey: "send_sms", roleKey: "admin", requestedBy: "test" } },
];

describe("SchedulerService — immediate scheduling", () => {
  it("creates a pending job and runDue executes it", async () => {
    const repos = makeContainer();
    const loopRuntime = createLoopRuntimeService(repos, makeToolFabric());
    const stepRegistry = new Map<string, StepEntry[]>();
    const scheduler = createSchedulerService(repos, loopRuntime, stepRegistry);

    const job = await scheduler.scheduleImmediate(ORG_ID, BIZ_ID, WORKFLOW_KEY, simpleSteps);
    expect(job.state).toBe("pending");
    expect(job.triggerType).toBe("immediate");

    const count = await scheduler.runDue();
    expect(count).toBe(1);

    const updated = await repos.schedulerJobs.findById(ORG_ID, job.id);
    expect(updated?.state).toBe("completed");
    expect(updated?.runCount).toBe(1);
  });

  it("listPending shows pending jobs", async () => {
    const repos = makeContainer();
    const loopRuntime = createLoopRuntimeService(repos, makeToolFabric());
    const stepRegistry = new Map<string, StepEntry[]>();
    const scheduler = createSchedulerService(repos, loopRuntime, stepRegistry);

    await scheduler.scheduleImmediate(ORG_ID, BIZ_ID, WORKFLOW_KEY, simpleSteps);
    const pending = await scheduler.listPending(ORG_ID, BIZ_ID);
    expect(pending.length).toBeGreaterThan(0);
    expect(pending.every((j) => j.state === "pending")).toBe(true);
  });

  it("cancel transitions job to cancelled and runDue skips it", async () => {
    const repos = makeContainer();
    const loopRuntime = createLoopRuntimeService(repos, makeToolFabric());
    const stepRegistry = new Map<string, StepEntry[]>();
    const scheduler = createSchedulerService(repos, loopRuntime, stepRegistry);

    const job = await scheduler.scheduleImmediate(ORG_ID, BIZ_ID, WORKFLOW_KEY, simpleSteps);
    await scheduler.cancel(ORG_ID, job.id);

    const cancelled = await repos.schedulerJobs.findById(ORG_ID, job.id);
    expect(cancelled?.state).toBe("cancelled");

    const count = await scheduler.runDue();
    expect(count).toBe(0);
  });
});

describe("SchedulerService — delayed scheduling", () => {
  it("delayed job with future run_at is not picked up by runDue immediately", async () => {
    const repos = makeContainer();
    const loopRuntime = createLoopRuntimeService(repos, makeToolFabric());
    const stepRegistry = new Map<string, StepEntry[]>();
    const scheduler = createSchedulerService(repos, loopRuntime, stepRegistry);

    // 1-hour delay — will not be due right now
    const job = await scheduler.scheduleDelayed(ORG_ID, BIZ_ID, WORKFLOW_KEY, 60 * 60 * 1000, simpleSteps);
    expect(job.state).toBe("pending");
    expect(job.triggerType).toBe("delayed");
    expect(new Date(job.runAt).getTime()).toBeGreaterThan(Date.now());

    const count = await scheduler.runDue();
    expect(count).toBe(0);
  });
});

describe("SchedulerService — cron scheduling", () => {
  it("cron job is created with null maxRuns and stays pending after first run if more runs allowed", async () => {
    const repos = makeContainer();
    const loopRuntime = createLoopRuntimeService(repos, makeToolFabric());
    const stepRegistry = new Map<string, StepEntry[]>();
    const scheduler = createSchedulerService(repos, loopRuntime, stepRegistry);

    const job = await scheduler.scheduleCron(ORG_ID, BIZ_ID, WORKFLOW_KEY, "0 9 * * *", simpleSteps);
    expect(job.cronExpression).toBe("0 9 * * *");
    expect(job.maxRuns).toBeNull();

    const count = await scheduler.runDue();
    expect(count).toBe(1);

    const updated = await repos.schedulerJobs.findById(ORG_ID, job.id);
    // unlimited cron job stays pending for next fire
    expect(updated?.state).toBe("pending");
    expect(updated?.runCount).toBe(1);
  });
});

describe("Loop Runtime — parallel step execution", () => {
  it("runs parallel group steps concurrently and all must succeed", async () => {
    const repos = makeContainer();
    const toolFabric = makeToolFabric();
    const loopRuntime = createLoopRuntimeService(repos, toolFabric);

    const group: ParallelStepGroup = {
      groupKey: "parallel-comms",
      parallel: true,
      steps: [
        { stepKey: "notify-sms", taskType: "tool", input: { orgId: ORG_ID, businessId: BIZ_ID, capabilityKey: "send_sms", roleKey: "admin", requestedBy: "test" } },
        { stepKey: "notify-email", taskType: "tool", input: { orgId: ORG_ID, businessId: BIZ_ID, capabilityKey: "send_email", roleKey: "admin", requestedBy: "test" } },
      ],
    };

    const execution = await loopRuntime.execute(ORG_ID, BIZ_ID, "parallel-test", [group]);
    expect(execution.state).toBe("completed");
  });

  it("parallel group failure rolls back and marks workflow failed", async () => {
    const repos = makeContainer();
    const toolFabric = makeToolFabric();
    // Make one step fail
    (toolFabric.requestTool as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: "e1", output: null, errorMessage: "SMS failed" });

    const loopRuntime = createLoopRuntimeService(repos, toolFabric);

    const group: ParallelStepGroup = {
      groupKey: "parallel-fail",
      parallel: true,
      steps: [
        { stepKey: "fail-step", taskType: "tool", input: { orgId: ORG_ID, businessId: BIZ_ID, capabilityKey: "send_sms", roleKey: "admin", requestedBy: "test" } },
      ],
    };

    const execution = await loopRuntime.execute(ORG_ID, BIZ_ID, "parallel-fail-test", [group]);
    expect(execution.state).toBe("failed");
  });
});

describe("Loop Runtime — step timeout enforcement", () => {
  it("step with timeoutMs transitions task to timed_out when handler is slow", async () => {
    const repos = makeContainer();
    // Handler that never resolves within the timeout
    const slowFabric: ToolFabricService = {
      requestTool: vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ id: "e1", output: { ok: true }, errorMessage: null }), 500))
      ),
      connectIntegration: vi.fn(),
      listIntegrations: vi.fn().mockResolvedValue([]),
      getProviderHealth: vi.fn().mockResolvedValue([]),
      getAuditLog: vi.fn().mockResolvedValue([]),
    } as unknown as ToolFabricService;

    const loopRuntime = createLoopRuntimeService(repos, slowFabric);

    const steps: StepEntry[] = [
      {
        stepKey: "slow-step",
        taskType: "tool",
        input: { orgId: ORG_ID, businessId: BIZ_ID, capabilityKey: "send_sms", roleKey: "admin", requestedBy: "test" },
        timeoutMs: 50, // 50ms timeout, handler takes 500ms
      },
    ];

    const execution = await loopRuntime.execute(ORG_ID, BIZ_ID, "timeout-test", steps);
    expect(execution.state).toBe("failed");

    // Verify the task_execution transitioned to timed_out
    const tasks = await repos.taskExecutions.listByWorkflowExecutionId(ORG_ID, execution.id);
    const timedOut = tasks.find((t) => t.state === "timed_out");
    expect(timedOut).toBeDefined();
  });
});
