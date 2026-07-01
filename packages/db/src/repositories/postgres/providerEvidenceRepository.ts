import type { ProviderEvidence } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { ProviderEvidenceRepository } from "../types.js";

interface EvidenceRow {
  id: string;
  org_id: string;
  business_id: string;
  tool_execution_id: string;
  provider_key: string;
  tool_key: string;
  status: ProviderEvidence["status"];
  latency_ms: number;
  attempt_count: number;
  error_code: string | null;
  response_snapshot: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toEvidence(row: EvidenceRow): ProviderEvidence {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    toolExecutionId: row.tool_execution_id,
    providerKey: row.provider_key,
    toolKey: row.tool_key,
    status: row.status,
    latencyMs: row.latency_ms,
    attemptCount: row.attempt_count,
    errorCode: row.error_code,
    responseSnapshot: row.response_snapshot,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresProviderEvidenceRepository(): ProviderEvidenceRepository {
  return {
    async create(input) {
      const rows = await query<EvidenceRow>(
        `INSERT INTO provider_evidence
           (org_id, business_id, tool_execution_id, provider_key, tool_key, status, latency_ms, attempt_count, error_code, response_snapshot)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          input.orgId,
          input.businessId,
          input.toolExecutionId,
          input.providerKey,
          input.toolKey,
          input.status,
          input.latencyMs,
          input.attemptCount,
          input.errorCode,
          input.responseSnapshot ? JSON.stringify(input.responseSnapshot) : null,
        ]
      );
      return toEvidence(firstRow(rows));
    },
    async listByToolExecutionId(orgId, toolExecutionId) {
      const rows = await query<EvidenceRow>(
        `SELECT * FROM provider_evidence WHERE org_id = $1 AND tool_execution_id = $2 AND deleted_at IS NULL`,
        [orgId, toolExecutionId]
      );
      return rows.map(toEvidence);
    },
    async listByBusinessId(orgId, businessId) {
      const rows = await query<EvidenceRow>(
        `SELECT * FROM provider_evidence WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC`,
        [orgId, businessId]
      );
      return rows.map(toEvidence);
    },
  };
}
