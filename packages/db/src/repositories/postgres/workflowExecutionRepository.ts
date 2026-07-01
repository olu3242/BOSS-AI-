import type { WorkflowExecution } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { WorkflowExecutionRepository } from "../types.js";

interface Row {
  id: string;
  org_id: string;
  business_id: string;
  workflow_key: string;
  state: WorkflowExecution["state"];
  current_step_index: number;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toExecution(row: Row): WorkflowExecution {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    workflowKey: row.workflow_key,
    state: row.state,
    currentStepIndex: row.current_step_index,
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

export function createPostgresWorkflowExecutionRepository(): WorkflowExecutionRepository {
  return {
    async create(input) {
      const rows = await query<Row>(
        `INSERT INTO workflow_executions (org_id, business_id, workflow_key, state, current_step_index, input, output, error_message, started_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          input.orgId,
          input.businessId,
          input.workflowKey,
          input.state,
          input.currentStepIndex,
          JSON.stringify(input.input),
          input.output ? JSON.stringify(input.output) : null,
          input.errorMessage,
          input.startedAt,
          input.completedAt,
        ]
      );
      return toExecution(firstRow(rows));
    },
    async updateState(orgId, id, state, currentStepIndex, output, errorMessage, completedAt) {
      const rows = await query<Row>(
        `UPDATE workflow_executions
         SET state = $3, current_step_index = $4, output = $5, error_message = $6, completed_at = $7, updated_at = now()
         WHERE org_id = $1 AND id = $2
         RETURNING *`,
        [orgId, id, state, currentStepIndex, output ? JSON.stringify(output) : null, errorMessage, completedAt]
      );
      return toExecution(firstRow(rows));
    },
    async listByBusinessId(orgId, businessId) {
      const rows = await query<Row>(
        `SELECT * FROM workflow_executions WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL ORDER BY started_at DESC`,
        [orgId, businessId]
      );
      return rows.map(toExecution);
    },
  };
}
