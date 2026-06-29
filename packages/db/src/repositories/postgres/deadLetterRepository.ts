import type { DeadLetterEntry } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { DeadLetterRepository } from "../types.js";

interface Row {
  id: string;
  org_id: string;
  business_id: string;
  workflow_execution_id: string;
  task_execution_id: string;
  step_key: string;
  reason: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toEntry(row: Row): DeadLetterEntry {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    workflowExecutionId: row.workflow_execution_id,
    taskExecutionId: row.task_execution_id,
    stepKey: row.step_key,
    reason: row.reason,
    payload: row.payload,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresDeadLetterRepository(): DeadLetterRepository {
  return {
    async add(input) {
      const rows = await query<Row>(
        `INSERT INTO dead_letter_queue (org_id, business_id, workflow_execution_id, task_execution_id, step_key, reason, payload)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [input.orgId, input.businessId, input.workflowExecutionId, input.taskExecutionId, input.stepKey, input.reason, JSON.stringify(input.payload)]
      );
      return toEntry(firstRow(rows));
    },
    async listByBusinessId(orgId, businessId) {
      const rows = await query<Row>(
        `SELECT * FROM dead_letter_queue WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC`,
        [orgId, businessId]
      );
      return rows.map(toEntry);
    },
  };
}
