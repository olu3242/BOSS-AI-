import type { StepEntry } from "@boss/loop";
import { nowIso } from "@boss/shared";
import type { SchedulerJob } from "@boss/types";
import type { RepositoryContainer } from "../container.js";
import type { LoopRuntimeService } from "./loopRuntimeService.js";

// Computes the next UTC run time from a 5-field cron expression (min hr dom mon dow).
// Supports: * (every), star/n (every n), single values, comma-separated lists.
// Returns an ISO string at most 1 year in the future, or null if expression is invalid.
export function computeNextCronRun(expression: string, after: Date = new Date()): string | null {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) return null;
  const [minExpr, hrExpr, domExpr, monExpr, dowExpr] = fields as [string, string, string, string, string];

  function parse(expr: string, min: number, max: number): number[] {
    if (expr === "*") return Array.from({ length: max - min + 1 }, (_, i) => i + min);
    if (expr.startsWith("*/")) {
      const step = parseInt(expr.slice(2), 10);
      if (isNaN(step) || step < 1) return [];
      return Array.from({ length: max - min + 1 }, (_, i) => i + min).filter((v) => (v - min) % step === 0);
    }
    return expr.split(",").map(Number).filter((v) => !isNaN(v) && v >= min && v <= max);
  }

  const minutes = parse(minExpr, 0, 59);
  const hours = parse(hrExpr, 0, 23);
  const doms = parse(domExpr, 1, 31);
  const months = parse(monExpr, 1, 12);
  const dows = parse(dowExpr, 0, 6);
  if (!minutes.length || !hours.length || !doms.length || !months.length || !dows.length) return null;

  // Advance by at least 1 minute to avoid returning 'after' itself
  const candidate = new Date(after.getTime() + 60_000);
  candidate.setUTCSeconds(0, 0);

  const deadline = new Date(after.getTime() + 365 * 24 * 3600_000);
  while (candidate < deadline) {
    if (
      months.includes(candidate.getUTCMonth() + 1) &&
      (domExpr === "*" || dowExpr === "*" ? true : doms.includes(candidate.getUTCDate()) || dows.includes(candidate.getUTCDay())) &&
      hours.includes(candidate.getUTCHours()) &&
      minutes.includes(candidate.getUTCMinutes())
    ) {
      return candidate.toISOString();
    }
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }
  return null;
}

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

  /** Poll and execute all jobs whose run_at <= now. Returns the count executed. */
  runDue(): Promise<number>;

  /** Retry failed jobs that have not exceeded maxRuns, re-queuing them with exponential backoff. */
  recoverFailed(orgId: string, businessId: string): Promise<number>;
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
          let nextRunAt: string | null | undefined = undefined;
          if (!isOneShot && job.cronExpression) {
            nextRunAt = computeNextCronRun(job.cronExpression) ?? null;
          } else if (isOneShot) {
            nextRunAt = null;
          }

          await repos.schedulerJobs.updateState(job.orgId, job.id, isOneShot ? "completed" : "pending", {
            lastRunAt: nowIso(),
            runCount: newCount,
            nextRunAt,
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

    async recoverFailed(orgId, businessId) {
      const jobs = await repos.schedulerJobs.listByBusiness(orgId, businessId);
      const failed = jobs.filter(
        (j) => j.state === "failed" && (j.maxRuns === null || j.runCount < j.maxRuns)
      );
      let recovered = 0;
      for (const job of failed) {
        // Exponential backoff: 2^runCount minutes, capped at 60 minutes
        const backoffMs = Math.min(Math.pow(2, job.runCount) * 60_000, 3_600_000);
        const retryAt = new Date(Date.now() + backoffMs).toISOString();
        await repos.schedulerJobs.updateState(job.orgId, job.id, "pending", { nextRunAt: retryAt });
        recovered += 1;
      }
      return recovered;
    },
  };
}
