import type { TaskExecution } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { TaskExecutionRepository } from "../types.js";

interface Row {
  id: string;
  org_id: string;
  business_id: string;
  workflow_execution_id: string;
  step_key: string;
  task_type: TaskExecution["taskType"];
  state: TaskExecution["state"];
  attempt: number;
  max_retries: number;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toTask(row: Row): TaskExecution {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    workflowExecutionId: row.workflow_execution_id,
    stepKey: row.step_key,
    taskType: row.task_type,
    state: row.state,
    attempt: row.attempt,
    maxRetries: row.max_retries,
    input: row.input,
    output: row.output,
    errorMessage: row.error_message,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresTaskExecutionRepository(): TaskExecutionRepository {
  return {
    async create(input) {
      const rows = await query<Row>(
        `INSERT INTO task_executions (org_id, business_id, workflow_execution_id, step_key, task_type, state, attempt, max_retries, input, output, error_message, started_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          input.orgId,
          input.businessId,
          input.workflowExecutionId,
          input.stepKey,
          input.taskType,
          input.state,
          input.attempt,
          input.maxRetries,
          JSON.stringify(input.input),
          input.output ? JSON.stringify(input.output) : null,
          input.errorMessage,
          input.startedAt,
          input.completedAt,
        ]
      );
      return toTask(firstRow(rows));
    },
    async updateState(orgId, id, state, attempt, output, errorMessage, completedAt) {
      const rows = await query<Row>(
        `UPDATE task_executions
         SET state = $3, attempt = $4, output = $5, error_message = $6, completed_at = $7, updated_at = now()
         WHERE org_id = $1 AND id = $2
         RETURNING *`,
        [orgId, id, state, attempt, output ? JSON.stringify(output) : null, errorMessage, completedAt]
      );
      return toTask(firstRow(rows));
    },
    async listByWorkflowExecutionId(orgId, workflowExecutionId) {
      const rows = await query<Row>(
        `SELECT * FROM task_executions WHERE org_id = $1 AND workflow_execution_id = $2 ORDER BY started_at ASC`,
        [orgId, workflowExecutionId]
      );
      return rows.map(toTask);
    },
  };
}
