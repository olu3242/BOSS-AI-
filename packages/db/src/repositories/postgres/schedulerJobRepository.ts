import type { SchedulerJob, SchedulerJobState } from "@boss/types";
import { query } from "../../client.js";
import type { SchedulerJobRepository } from "../types.js";

interface JobRow {
  id: string;
  org_id: string;
  business_id: string;
  workflow_key: string;
  trigger_type: string;
  cron_expression: string | null;
  timezone: string;
  run_at: string;
  state: string;
  last_run_at: string | null;
  next_run_at: string | null;
  run_count: number;
  max_runs: number | null;
  payload: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toJob(row: JobRow): SchedulerJob {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    workflowKey: row.workflow_key,
    triggerType: row.trigger_type as SchedulerJob["triggerType"],
    cronExpression: row.cron_expression,
    timezone: row.timezone,
    runAt: row.run_at,
    state: row.state as SchedulerJobState,
    lastRunAt: row.last_run_at,
    nextRunAt: row.next_run_at,
    runCount: row.run_count,
    maxRuns: row.max_runs,
    payload: row.payload,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
  };
}

export function createPostgresSchedulerJobRepository(): SchedulerJobRepository {
  return {
    async create(input) {
      const rows = await query<JobRow>(
        `INSERT INTO scheduler_jobs
          (org_id, business_id, workflow_key, trigger_type, cron_expression, timezone,
           run_at, state, last_run_at, next_run_at, run_count, max_runs, payload, error_message)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING *`,
        [
          input.orgId, input.businessId, input.workflowKey, input.triggerType,
          input.cronExpression ?? null, input.timezone, input.runAt, input.state,
          input.lastRunAt ?? null, input.nextRunAt ?? null, input.runCount,
          input.maxRuns ?? null, JSON.stringify(input.payload), input.errorMessage ?? null,
        ]
      );
      return toJob(rows[0]!);
    },

    async findById(orgId, id) {
      const rows = await query<JobRow>(
        `SELECT * FROM scheduler_jobs WHERE org_id=$1 AND id=$2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      return rows[0] ? toJob(rows[0]) : null;
    },

    async updateState(orgId, id, state, fields = {}) {
      const rows = await query<JobRow>(
        `UPDATE scheduler_jobs
         SET state=$3,
             last_run_at=COALESCE($4, last_run_at),
             next_run_at=COALESCE($5, next_run_at),
             run_count=COALESCE($6, run_count),
             error_message=COALESCE($7, error_message),
             updated_at=now()
         WHERE org_id=$1 AND id=$2 AND deleted_at IS NULL
         RETURNING *`,
        [
          orgId, id, state,
          fields.lastRunAt ?? null,
          fields.nextRunAt ?? null,
          fields.runCount ?? null,
          fields.errorMessage ?? null,
        ]
      );
      return toJob(rows[0]!);
    },

    async listDuePending(now) {
      const rows = await query<JobRow>(
        `SELECT * FROM scheduler_jobs
         WHERE state='pending' AND run_at<=$1 AND deleted_at IS NULL
         ORDER BY run_at ASC`,
        [now]
      );
      return rows.map(toJob);
    },

    async listByBusiness(orgId, businessId) {
      const rows = await query<JobRow>(
        `SELECT * FROM scheduler_jobs
         WHERE org_id=$1 AND business_id=$2 AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        [orgId, businessId]
      );
      return rows.map(toJob);
    },

    async cancel(orgId, id) {
      await query(
        `UPDATE scheduler_jobs SET state='cancelled', updated_at=now()
         WHERE org_id=$1 AND id=$2 AND deleted_at IS NULL`,
        [orgId, id]
      );
    },
  };
}
