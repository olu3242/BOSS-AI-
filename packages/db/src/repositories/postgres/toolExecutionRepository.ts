import type { ToolExecution, ToolAuditRecord } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { ToolExecutionRepository } from "../types.js";

interface ExecutionRow {
  id: string;
  org_id: string;
  business_id: string;
  tool_key: string;
  capability_key: string;
  provider_key: string;
  requested_by: string;
  status: ToolExecution["status"];
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface AuditRow {
  id: string;
  org_id: string;
  business_id: string;
  tool_execution_id: string;
  action: string;
  actor: string;
  details: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
}

function toExecution(row: ExecutionRow): ToolExecution {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    toolKey: row.tool_key,
    capabilityKey: row.capability_key,
    providerKey: row.provider_key,
    requestedBy: row.requested_by,
    status: row.status,
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

function toAudit(row: AuditRow): ToolAuditRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    toolExecutionId: row.tool_execution_id,
    action: row.action,
    actor: row.actor,
    details: row.details,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
  };
}

export function createPostgresToolExecutionRepository(): ToolExecutionRepository {
  return {
    async create(input) {
      const rows = await query<ExecutionRow>(
        `INSERT INTO tool_executions (org_id, business_id, tool_key, capability_key, provider_key, requested_by, status, input, output, error_message, started_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          input.orgId,
          input.businessId,
          input.toolKey,
          input.capabilityKey,
          input.providerKey,
          input.requestedBy,
          input.status,
          JSON.stringify(input.input),
          input.output ? JSON.stringify(input.output) : null,
          input.errorMessage,
          input.startedAt,
          input.completedAt,
        ]
      );
      return toExecution(firstRow(rows));
    },
    async updateStatus(orgId, id, status, output, errorMessage) {
      const rows = await query<ExecutionRow>(
        `UPDATE tool_executions SET status = $3, output = $4, error_message = $5, completed_at = now(), updated_at = now()
         WHERE org_id = $1 AND id = $2
         RETURNING *`,
        [orgId, id, status, output ? JSON.stringify(output) : null, errorMessage]
      );
      return toExecution(firstRow(rows));
    },
    async listByBusinessId(orgId, businessId) {
      const rows = await query<ExecutionRow>(
        `SELECT * FROM tool_executions WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL ORDER BY started_at DESC`,
        [orgId, businessId]
      );
      return rows.map(toExecution);
    },
    async addAuditRecord(input) {
      const rows = await query<AuditRow>(
        `INSERT INTO tool_audit_history (org_id, business_id, tool_execution_id, action, actor, details, occurred_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [input.orgId, input.businessId, input.toolExecutionId, input.action, input.actor, JSON.stringify(input.details), input.occurredAt]
      );
      return toAudit(firstRow(rows));
    },
    async listAuditRecords(orgId, businessId) {
      const rows = await query<AuditRow>(
        `SELECT * FROM tool_audit_history WHERE org_id = $1 AND business_id = $2 ORDER BY occurred_at DESC`,
        [orgId, businessId]
      );
      return rows.map(toAudit);
    },
  };
}
