import type { ProviderHealth } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { ProviderHealthRepository } from "../types.js";

interface HealthRow {
  id: string;
  org_id: string;
  business_id: string;
  provider_key: string;
  status: ProviderHealth["status"];
  latency_ms: number | null;
  failure_count: number;
  quota_remaining: number | null;
  authenticated: boolean;
  checked_at: string;
  created_at: string;
  updated_at: string;
}

function toHealth(row: HealthRow): ProviderHealth {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    providerKey: row.provider_key,
    status: row.status,
    latencyMs: row.latency_ms,
    failureCount: row.failure_count,
    quotaRemaining: row.quota_remaining,
    authenticated: row.authenticated,
    checkedAt: row.checked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createPostgresProviderHealthRepository(): ProviderHealthRepository {
  return {
    async upsert(input) {
      const rows = await query<HealthRow>(
        `INSERT INTO provider_health (org_id, business_id, provider_key, status, latency_ms, failure_count, quota_remaining, authenticated, checked_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (business_id, provider_key) DO UPDATE SET
           status = EXCLUDED.status, latency_ms = EXCLUDED.latency_ms, failure_count = EXCLUDED.failure_count,
           quota_remaining = EXCLUDED.quota_remaining, authenticated = EXCLUDED.authenticated,
           checked_at = EXCLUDED.checked_at, updated_at = now()
         RETURNING *`,
        [
          input.orgId,
          input.businessId,
          input.providerKey,
          input.status,
          input.latencyMs,
          input.failureCount,
          input.quotaRemaining,
          input.authenticated,
          input.checkedAt,
        ]
      );
      return toHealth(firstRow(rows));
    },
    async listByBusinessId(orgId, businessId) {
      const rows = await query<HealthRow>(`SELECT * FROM provider_health WHERE org_id = $1 AND business_id = $2`, [orgId, businessId]);
      return rows.map(toHealth);
    },
  };
}
