import { describe, it, expect, beforeEach, vi } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createSchedulerService } from "../services/schedulerService.js";
import { createLoopRuntimeService } from "../services/loopRuntimeService.js";
import type { StepEntry } from "@boss/loop";
import type { ToolFabricService } from "../services/toolFabricService.js";
import { nowIso } from "@boss/shared";

const ORG = "org-recovery";
const BIZ = "biz-recovery";

function makeToolFabric(): ToolFabricService {
  return {
    requestTool: vi.fn().mockResolvedValue({ id: "exec-1", output: { ok: true }, errorMessage: null }),
    connectIntegration: vi.fn(),
    listIntegrations: vi.fn().mockResolvedValue([]),
    getProviderHealth: vi.fn().mockResolvedValue([]),
    getAuditLog: vi.fn().mockResolvedValue([]),
  } as unknown as ToolFabricService;
}

const steps: StepEntry[] = [
  { stepKey: "s1", taskType: "tool", input: { orgId: ORG, businessId: BIZ, capabilityKey: "send_sms", roleKey: "admin", requestedBy: "test" } },
];

describe("RC1.5 — Runtime Recovery (Phase 2)", () => {
  let repos: ReturnType<typeof createInMemoryContainer>;
  let scheduler: ReturnType<typeof createSchedulerService>;
  const stepRegistry = new Map<string, StepEntry[]>();

  beforeEach(() => {
    repos = createInMemoryContainer();
    const loop = createLoopRuntimeService(repos, makeToolFabric());
    scheduler = createSchedulerService(repos, loop, stepRegistry);
    stepRegistry.clear();
  });

  it("recoverFailed returns 0 when no failed jobs exist", async () => {
    await scheduler.scheduleImmediate(ORG, BIZ, "wf-ok", steps);
    const recovered = await scheduler.recoverFailed(ORG, BIZ);
    expect(recovered).toBe(0);
  });

  it("recoverFailed reschedules a failed job to pending", async () => {
    const job = await scheduler.scheduleImmediate(ORG, BIZ, "wf-fail", steps);
    await repos.schedulerJobs.updateState(ORG, job.id, "failed", { errorMessage: "timeout", lastRunAt: nowIso() });

    const recovered = await scheduler.recoverFailed(ORG, BIZ);
    expect(recovered).toBe(1);

    const all = await repos.schedulerJobs.listByBusiness(ORG, BIZ);
    const recoveredJob = all.find((j) => j.id === job.id);
    expect(recoveredJob?.state).toBe("pending");
    expect(new Date(recoveredJob!.nextRunAt!).getTime()).toBeGreaterThan(Date.now());
  });

  it("jobs that hit maxRuns are not recovered", async () => {
    const job = await scheduler.scheduleImmediate(ORG, BIZ, "wf-maxed", steps, { maxRuns: 1 });
    // Mark as failed with runCount = maxRuns (1)
    await repos.schedulerJobs.updateState(ORG, job.id, "failed", { errorMessage: "hit max", lastRunAt: nowIso(), runCount: 1 });

    const recovered = await scheduler.recoverFailed(ORG, BIZ);
    expect(recovered).toBe(0);

    const all = await repos.schedulerJobs.listByBusiness(ORG, BIZ);
    expect(all.find((j) => j.id === job.id)?.state).toBe("failed");
  });

  it("dead-letter items are persisted and retrievable", async () => {
    // Use the loop runtime to create a dead letter via a failed workflow
    const wf = await repos.workflowExecutions.create({
      orgId: ORG, businessId: BIZ, workflowKey: "wf-dead",
      state: "failed", currentStepIndex: 0,
      input: {}, output: null, errorMessage: "execution error",
      startedAt: nowIso(), completedAt: nowIso(),
    });

    const task = await repos.taskExecutions.create({
      orgId: ORG, businessId: BIZ, workflowExecutionId: wf.id,
      stepKey: "step-fail", taskType: "tool",
      state: "failed", attempt: 3, maxRetries: 3,
      input: { step: "send_invoice" }, output: null,
      errorMessage: "max retries exceeded",
      startedAt: nowIso(), completedAt: nowIso(),
    });

    const entry = await repos.deadLetters.add({
      orgId: ORG, businessId: BIZ,
      workflowExecutionId: wf.id,
      taskExecutionId: task.id,
      stepKey: "step-fail",
      reason: "max retries exceeded",
      payload: { step: "send_invoice" },
    });

    expect(entry.id).toBeDefined();
    const all = await repos.deadLetters.listByBusinessId(ORG, BIZ);
    expect(all.some((e) => e.id === entry.id)).toBe(true);
  });

  it("workflow execution state persists across multiple task completions", async () => {
    const wf = await repos.workflowExecutions.create({
      orgId: ORG, businessId: BIZ, workflowKey: "wf-multi",
      state: "running", currentStepIndex: 0,
      input: {}, output: null, errorMessage: null,
      startedAt: nowIso(), completedAt: null,
    });

    await repos.taskExecutions.create({ orgId: ORG, businessId: BIZ, workflowExecutionId: wf.id, stepKey: "s1", taskType: "tool", state: "completed", attempt: 1, maxRetries: 3, input: {}, output: { ok: true }, errorMessage: null, startedAt: nowIso(), completedAt: nowIso() });
    await repos.taskExecutions.create({ orgId: ORG, businessId: BIZ, workflowExecutionId: wf.id, stepKey: "s2", taskType: "tool", state: "completed", attempt: 1, maxRetries: 3, input: {}, output: { ok: true }, errorMessage: null, startedAt: nowIso(), completedAt: nowIso() });

    const tasks = await repos.taskExecutions.listByWorkflowExecutionId(ORG, wf.id);
    expect(tasks.length).toBe(2);
    expect(tasks.every((t) => t.state === "completed")).toBe(true);
  });
});
