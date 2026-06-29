import type { ExecutionEventRecord } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { ExecutionEventRepository } from "../types.js";

interface Row {
  id: string;
  org_id: string;
  business_id: string;
  workflow_execution_id: string;
  type: string;
  payload: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
}

function toEvent(row: Row): ExecutionEventRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    workflowExecutionId: row.workflow_execution_id,
    type: row.type,
    payload: row.payload,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
  };
}

export function createPostgresExecutionEventRepository(): ExecutionEventRepository {
  return {
    async append(input) {
      const rows = await query<Row>(
        `INSERT INTO execution_events (org_id, business_id, workflow_execution_id, type, payload, occurred_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [input.orgId, input.businessId, input.workflowExecutionId, input.type, JSON.stringify(input.payload), input.occurredAt]
      );
      return toEvent(firstRow(rows));
    },
    async listByWorkflowExecutionId(orgId, workflowExecutionId) {
      const rows = await query<Row>(
        `SELECT * FROM execution_events WHERE org_id = $1 AND workflow_execution_id = $2 ORDER BY occurred_at ASC`,
        [orgId, workflowExecutionId]
      );
      return rows.map(toEvent);
    },
  };
}
