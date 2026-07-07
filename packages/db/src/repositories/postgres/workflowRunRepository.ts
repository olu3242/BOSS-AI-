import type { WorkflowRun, WorkflowRunStatus } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { WorkflowRunRepository } from "../types.js";

interface WorkflowRunRow {
  id: string;
  org_id: string;
  business_id: string;
  workflow_id: string;
  status: string;
  triggered_by: string;
  business_object_type: string | null;
  business_object_id: string | null;
  runtime_execution_id: string | null;
  result: Record<string, unknown> | null;
  error_message: string | null;
  duration_ms: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toWorkflowRun(row: WorkflowRunRow): WorkflowRun {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    workflowId: row.workflow_id,
    status: row.status as WorkflowRunStatus,
    triggeredBy: row.triggered_by,
    businessObjectType: row.business_object_type,
    businessObjectId: row.business_object_id,
    runtimeExecutionId: row.runtime_execution_id,
    result: row.result,
    errorMessage: row.error_message,
    durationMs: row.duration_ms,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
  };
}

export function createPostgresWorkflowRunRepository(): WorkflowRunRepository {
  return {
    async create(input) {
      const rows = await query<WorkflowRunRow>(
        `INSERT INTO workflow_runs
           (org_id, business_id, workflow_id, status, triggered_by,
            business_object_type, business_object_id, runtime_execution_id,
            result, error_message, duration_ms, started_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [input.orgId, input.businessId, input.workflowId, input.status ?? 'pending',
         input.triggeredBy, input.businessObjectType ?? null, input.businessObjectId ?? null,
         input.runtimeExecutionId ?? null,
         input.result ? JSON.stringify(input.result) : null,
         input.errorMessage ?? null, input.durationMs ?? null,
         input.startedAt ?? null, input.completedAt ?? null]
      );
      return toWorkflowRun(firstRow(rows)!);
    },

    async findById(orgId, id) {
      const rows = await query<WorkflowRunRow>(
        `SELECT * FROM workflow_runs WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      const row = firstRow(rows);
      return row ? toWorkflowRun(row) : null;
    },

    async update(orgId, id, patch) {
      const rows = await query<WorkflowRunRow>(
        `UPDATE workflow_runs SET
          status = COALESCE($3, status),
          runtime_execution_id = COALESCE($4, runtime_execution_id),
          result = COALESCE($5, result),
          error_message = COALESCE($6, error_message),
          duration_ms = COALESCE($7, duration_ms),
          started_at = COALESCE($8, started_at),
          completed_at = COALESCE($9, completed_at),
          updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [orgId, id, patch.status ?? null, patch.runtimeExecutionId ?? null,
         patch.result ? JSON.stringify(patch.result) : null,
         patch.errorMessage ?? null, patch.durationMs ?? null,
         patch.startedAt ?? null, patch.completedAt ?? null]
      );
      return toWorkflowRun(firstRow(rows)!);
    },

    async listByBusinessId(orgId, businessId) {
      const rows = await query<WorkflowRunRow>(
        `SELECT * FROM workflow_runs WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC`,
        [orgId, businessId]
      );
      return rows.map(toWorkflowRun);
    },

    async listByWorkflow(orgId, workflowId) {
      const rows = await query<WorkflowRunRow>(
        `SELECT * FROM workflow_runs WHERE org_id = $1 AND workflow_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC`,
        [orgId, workflowId]
      );
      return rows.map(toWorkflowRun);
    },

    async listByObject(orgId, businessObjectType, businessObjectId) {
      const rows = await query<WorkflowRunRow>(
        `SELECT * FROM workflow_runs WHERE org_id = $1 AND business_object_type = $2 AND business_object_id = $3 AND deleted_at IS NULL ORDER BY created_at DESC`,
        [orgId, businessObjectType, businessObjectId]
      );
      return rows.map(toWorkflowRun);
    },
  };
}
