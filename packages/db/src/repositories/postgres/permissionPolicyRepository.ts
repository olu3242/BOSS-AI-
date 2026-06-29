import type { PermissionPolicy } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { PermissionPolicyRepository } from "../types.js";

interface PolicyRow {
  id: string;
  org_id: string;
  business_id: string;
  tool_key: string;
  role_key: string;
  allowed: boolean;
  approval: PermissionPolicy["approval"];
  rate_limit_per_minute: number | null;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toPolicy(row: PolicyRow): PermissionPolicy {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    toolKey: row.tool_key,
    roleKey: row.role_key,
    allowed: row.allowed,
    approval: row.approval,
    rateLimitPerMinute: row.rate_limit_per_minute,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresPermissionPolicyRepository(): PermissionPolicyRepository {
  return {
    async upsert(input) {
      const rows = await query<PolicyRow>(
        `INSERT INTO permission_policies (org_id, business_id, tool_key, role_key, allowed, approval, rate_limit_per_minute, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (business_id, tool_key, role_key) DO UPDATE SET
           allowed = EXCLUDED.allowed, approval = EXCLUDED.approval,
           rate_limit_per_minute = EXCLUDED.rate_limit_per_minute, version = EXCLUDED.version, updated_at = now()
         RETURNING *`,
        [input.orgId, input.businessId, input.toolKey, input.roleKey, input.allowed, input.approval, input.rateLimitPerMinute, input.version]
      );
      return toPolicy(firstRow(rows));
    },
    async listByBusinessId(orgId, businessId) {
      const rows = await query<PolicyRow>(
        `SELECT * FROM permission_policies WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL`,
        [orgId, businessId]
      );
      return rows.map(toPolicy);
    },
  };
}
