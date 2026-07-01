/**
 * Business Transformation Engine (BTE)
 *
 * The BTE runs the core business improvement cycle for every active business.
 * Per CLAUDE.md Law 1: all intelligence comes from MCP (via businessOperatingLoopService).
 * Loop Runtime orchestrates; BTE schedules and coordinates.
 *
 * Daily cycle per business:
 *   1. Observe   — collect KPIs, constraints, health signals
 *   2. Analyze   — root cause analysis
 *   3. Decide    — generate ranked action list
 *   4. Plan      — create execution plan for safe actions
 *   5. Execute   — auto-execute safe plans, queue approvals for risky ones
 *   6. Verify    — snapshot state for outcome verification
 *   7. Learn     — record learnings in memory
 *   8. Improve   — surface improvement opportunities
 */
import { randomUUID } from "node:crypto";
import { nowIso } from "@boss/shared";
import type { RepositoryContainer } from "../container.js";
import type { BusinessOperatingLoopService, OperatingLoopResult } from "./businessOperatingLoopService.js";
import type { SchedulerService } from "./schedulerService.js";

export const BTE_WORKFLOW_KEY = "bte.daily_cycle";
export const BTE_CRON_EXPRESSION = "0 6 * * *"; // 06:00 UTC daily

export interface BteCycleResult {
  cycleId: string;
  orgId: string;
  businessId: string;
  status: "completed" | "failed" | "skipped";
  loopResult: OperatingLoopResult | null;
  scheduledNextAt: string | null;
  errorMessage: string | null;
  completedAt: string;
}

export interface BteScheduleEntry {
  orgId: string;
  businessId: string;
  jobId: string;
  cronExpression: string;
  nextRunAt: string | null;
  scheduledAt: string;
}

export interface BteService {
  /** Run the BTE cycle for a single business immediately. */
  runCycle(orgId: string, businessId: string): Promise<BteCycleResult>;

  /** Schedule the daily BTE cron job for a business. Idempotent — skips if already scheduled. */
  scheduleDailyCycle(orgId: string, businessId: string): Promise<BteScheduleEntry>;

  /** Cancel the daily BTE cron job for a business. */
  cancelDailyCycle(orgId: string, businessId: string): Promise<void>;

  /** Run all due BTE jobs. Called by the platform scheduler tick. */
  runDue(): Promise<{ executed: number }>;

  /** List all businesses with active BTE schedules. */
  listScheduled(orgId: string): Promise<BteScheduleEntry[]>;
}

export function createBteService(
  repos: RepositoryContainer,
  operatingLoop: BusinessOperatingLoopService,
  scheduler: SchedulerService
): BteService {
  return {
    async runCycle(orgId, businessId) {
      const cycleId = `bte_${randomUUID()}`;
      const completedAt = nowIso();

      await repos.eventBus.publish({
        type: "bte.cycle.started",
        payload: { orgId, businessId, cycleId },
        occurredAt: completedAt,
      });

      try {
        const loopResult = await operatingLoop.run(orgId, businessId);

        await repos.eventBus.publish({
          type: "bte.cycle.completed",
          payload: {
            orgId,
            businessId,
            cycleId,
            runId: loopResult.runId,
            decisionsGenerated: loopResult.decisionsGenerated,
            plansCreated: loopResult.plansCreated,
            phaseCount: loopResult.phases.length,
          },
          occurredAt: loopResult.completedAt,
        });

        return {
          cycleId,
          orgId,
          businessId,
          status: "completed",
          loopResult,
          scheduledNextAt: null,
          errorMessage: null,
          completedAt: loopResult.completedAt,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "BTE cycle failed";

        await repos.eventBus.publish({
          type: "bte.cycle.failed",
          payload: { orgId, businessId, cycleId, errorMessage },
          occurredAt: nowIso(),
        });

        return {
          cycleId,
          orgId,
          businessId,
          status: "failed",
          loopResult: null,
          scheduledNextAt: null,
          errorMessage,
          completedAt: nowIso(),
        };
      }
    },

    async scheduleDailyCycle(orgId, businessId) {
      // Idempotency: skip if a BTE cron job already exists for this business
      const existing = await scheduler.listPending(orgId, businessId);
      const alreadyScheduled = existing.find(
        (j) => j.workflowKey === BTE_WORKFLOW_KEY && j.triggerType === "cron"
      );

      if (alreadyScheduled) {
        return {
          orgId,
          businessId,
          jobId: alreadyScheduled.id,
          cronExpression: BTE_CRON_EXPRESSION,
          nextRunAt: alreadyScheduled.nextRunAt,
          scheduledAt: alreadyScheduled.createdAt,
        };
      }

      const job = await scheduler.scheduleCron(
        orgId,
        businessId,
        BTE_WORKFLOW_KEY,
        BTE_CRON_EXPRESSION,
        // BTE loop steps — the operating loop handles all intelligence internally
        [
          {
            stepKey: "bte_observe_analyze",
            taskType: "scheduled",
            input: { phase: "observe_analyze", orgId, businessId },
          },
          {
            stepKey: "bte_decide_plan",
            taskType: "scheduled",
            input: { phase: "decide_plan", orgId, businessId },
          },
          {
            stepKey: "bte_execute_verify",
            taskType: "scheduled",
            input: { phase: "execute_verify", orgId, businessId },
          },
          {
            stepKey: "bte_learn_improve",
            taskType: "scheduled",
            input: { phase: "learn_improve", orgId, businessId },
          },
        ],
        { timezone: "UTC" }
      );

      await repos.eventBus.publish({
        type: "bte.cycle.scheduled",
        payload: { orgId, businessId, jobId: job.id, cronExpression: BTE_CRON_EXPRESSION },
        occurredAt: nowIso(),
      });

      return {
        orgId,
        businessId,
        jobId: job.id,
        cronExpression: BTE_CRON_EXPRESSION,
        nextRunAt: job.nextRunAt,
        scheduledAt: job.createdAt,
      };
    },

    async cancelDailyCycle(orgId, businessId) {
      const pending = await scheduler.listPending(orgId, businessId);
      const btejobs = pending.filter(
        (j) => j.workflowKey === BTE_WORKFLOW_KEY && j.triggerType === "cron"
      );

      for (const job of btejobs) {
        await scheduler.cancel(orgId, job.id);
      }

      await repos.eventBus.publish({
        type: "bte.cycle.cancelled",
        payload: { orgId, businessId, cancelledJobs: btejobs.length },
        occurredAt: nowIso(),
      });
    },

    async runDue() {
      const executed = await scheduler.runDue();
      return { executed };
    },

    async listScheduled(orgId) {
      const jobs = await scheduler.listPending(orgId);
      return jobs
        .filter((j) => j.orgId === orgId && j.workflowKey === BTE_WORKFLOW_KEY && j.triggerType === "cron")
        .map((j) => ({
          orgId: j.orgId,
          businessId: j.businessId,
          jobId: j.id,
          cronExpression: j.cronExpression ?? BTE_CRON_EXPRESSION,
          nextRunAt: j.nextRunAt,
          scheduledAt: j.createdAt,
        }));
    },
  };
}
