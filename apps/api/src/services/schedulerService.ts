import type { StepEntry } from "@boss/loop";
import { nowIso } from "@boss/shared";
import type { SchedulerJob } from "@boss/types";
import type { RepositoryContainer } from "../container.js";
import type { LoopRuntimeService } from "./loopRuntimeService.js";

export interface ScheduleOpts {
  timezone?: string;
  payload?: Record<string, unknown>;
  maxRuns?: number;
}

export interface SchedulerService {
  scheduleImmediate(
    orgId: string,
    businessId: string,
    workflowKey: string,
    steps: StepEntry[],
    opts?: ScheduleOpts
  ): Promise<SchedulerJob>;

  scheduleDelayed(
    orgId: string,
    businessId: string,
    workflowKey: string,
    delayMs: number,
    steps: StepEntry[],
    opts?: ScheduleOpts
  ): Promise<SchedulerJob>;

  scheduleCron(
    orgId: string,
    businessId: string,
    workflowKey: string,
    cronExpression: string,
    steps: StepEntry[],
    opts?: ScheduleOpts
  ): Promise<SchedulerJob>;

  cancel(orgId: string, jobId: string): Promise<void>;

  listPending(orgId: string, businessId?: string): Promise<SchedulerJob[]>;

  /**
   * Poll and execute all jobs whose run_at <= now.
   * Returns the count of jobs that were executed.
   */
  runDue(): Promise<number>;
}

export function createSchedulerService(
  repos: RepositoryContainer,
  loopRuntime: LoopRuntimeService,
  // Steps are registered once; scheduler re-uses them per workflow key
  workflowStepRegistry: Map<string, StepEntry[]>
): SchedulerService {
  return {
    async scheduleImmediate(orgId, businessId, workflowKey, steps, opts = {}) {
      workflowStepRegistry.set(workflowKey, steps);
      return repos.schedulerJobs.create({
        orgId,
        businessId,
        workflowKey,
        triggerType: "immediate",
        cronExpression: null,
        timezone: opts.timezone ?? "UTC",
        runAt: nowIso(),
        state: "pending",
        lastRunAt: null,
        nextRunAt: null,
        runCount: 0,
        maxRuns: opts.maxRuns ?? 1,
        payload: opts.payload ?? {},
        errorMessage: null,
      });
    },

    async scheduleDelayed(orgId, businessId, workflowKey, delayMs, steps, opts = {}) {
      workflowStepRegistry.set(workflowKey, steps);
      const runAt = new Date(Date.now() + delayMs).toISOString();
      return repos.schedulerJobs.create({
        orgId,
        businessId,
        workflowKey,
        triggerType: "delayed",
        cronExpression: null,
        timezone: opts.timezone ?? "UTC",
        runAt,
        state: "pending",
        lastRunAt: null,
        nextRunAt: null,
        runCount: 0,
        maxRuns: opts.maxRuns ?? 1,
        payload: opts.payload ?? {},
        errorMessage: null,
      });
    },

    async scheduleCron(orgId, businessId, workflowKey, cronExpression, steps, opts = {}) {
      workflowStepRegistry.set(workflowKey, steps);
      return repos.schedulerJobs.create({
        orgId,
        businessId,
        workflowKey,
        triggerType: "cron",
        cronExpression,
        timezone: opts.timezone ?? "UTC",
        runAt: nowIso(),
        state: "pending",
        lastRunAt: null,
        nextRunAt: null,
        runCount: 0,
        maxRuns: opts.maxRuns ?? null,
        payload: opts.payload ?? {},
        errorMessage: null,
      });
    },

    async cancel(orgId, jobId) {
      await repos.schedulerJobs.cancel(orgId, jobId);
    },

    async listPending(orgId, businessId) {
      const all = businessId
        ? await repos.schedulerJobs.listByBusiness(orgId, businessId)
        : await repos.schedulerJobs.listDuePending(nowIso());
      return all.filter((j) => j.state === "pending");
    },

    async runDue() {
      const due = await repos.schedulerJobs.listDuePending(nowIso());
      let executed = 0;

      for (const job of due) {
        const steps = workflowStepRegistry.get(job.workflowKey);
        if (!steps) {
          await repos.schedulerJobs.updateState(job.orgId, job.id, "failed", {
            errorMessage: `No steps registered for workflow key "${job.workflowKey}"`,
            lastRunAt: nowIso(),
          });
          continue;
        }

        await repos.schedulerJobs.updateState(job.orgId, job.id, "running");

        try {
          await loopRuntime.execute(job.orgId, job.businessId, job.workflowKey, steps);

          const newCount = job.runCount + 1;
          const isOneShot = job.maxRuns !== null && newCount >= job.maxRuns;

          await repos.schedulerJobs.updateState(job.orgId, job.id, isOneShot ? "completed" : "pending", {
            lastRunAt: nowIso(),
            runCount: newCount,
            // For cron jobs that aren't done yet, keep state as pending with updated run_at
            // (A real pg_cron integration would compute nextRunAt from the expression;
            //  here we leave nextRunAt null — the job is done or stays for manual re-scheduling)
            nextRunAt: isOneShot ? null : undefined,
          });
        } catch (err) {
          await repos.schedulerJobs.updateState(job.orgId, job.id, "failed", {
            errorMessage: err instanceof Error ? err.message : String(err),
            lastRunAt: nowIso(),
          });
        }

        await repos.eventBus.publish({
          type: "scheduler.job.executed",
          payload: { orgId: job.orgId, businessId: job.businessId, workflowKey: job.workflowKey, jobId: job.id },
          occurredAt: nowIso(),
        });

        executed += 1;
      }

      return executed;
    },
  };
}
