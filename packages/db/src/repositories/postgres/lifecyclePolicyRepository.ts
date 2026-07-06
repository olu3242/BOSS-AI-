import type { LifecyclePolicy, LifecyclePolicyMode, LifecyclePolicyAction } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { LifecyclePolicyRepository } from "../types.js";

interface LifecyclePolicyRow {
  id: string;
  org_id: string;
  business_id: string;
  name: string;
  from_event: string;
  mode: string;
  action: LifecyclePolicyAction;
  conditions: Record<string, unknown>;
  approval_roles: string[];
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toPolicy(row: LifecyclePolicyRow): LifecyclePolicy {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    name: row.name,
    fromEvent: row.from_event,
    mode: row.mode as LifecyclePolicyMode,
    action: row.action,
    conditions: row.conditions ?? {},
    approvalRoles: row.approval_roles ?? [],
    priority: row.priority,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
  };
}

export function createPostgresLifecyclePolicyRepository(): LifecyclePolicyRepository {
  return {
    async create(input) {
      const rows = await query<LifecyclePolicyRow>(
        `INSERT INTO lifecycle_policies
           (org_id, business_id, name, from_event, mode, action, conditions, approval_roles, priority, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [input.orgId, input.businessId, input.name, input.fromEvent, input.mode,
         JSON.stringify(input.action), JSON.stringify(input.conditions ?? {}),
         input.approvalRoles ?? [], input.priority ?? 0, input.isActive ?? true]
      );
      return toPolicy(firstRow(rows)!);
    },

    async findById(orgId, id) {
      const rows = await query<LifecyclePolicyRow>(
        `SELECT * FROM lifecycle_policies WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      const row = firstRow(rows);
      return row ? toPolicy(row) : null;
    },

    async update(orgId, id, patch) {
      const rows = await query<LifecyclePolicyRow>(
        `UPDATE lifecycle_policies SET
          name = COALESCE($3, name),
          from_event = COALESCE($4, from_event),
          mode = COALESCE($5, mode),
          action = COALESCE($6, action),
          conditions = COALESCE($7, conditions),
          approval_roles = COALESCE($8, approval_roles),
          priority = COALESCE($9, priority),
          is_active = COALESCE($10, is_active),
          updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [orgId, id, patch.name ?? null, patch.fromEvent ?? null, patch.mode ?? null,
         patch.action ? JSON.stringify(patch.action) : null,
         patch.conditions ? JSON.stringify(patch.conditions) : null,
         patch.approvalRoles ?? null, patch.priority ?? null, patch.isActive ?? null]
      );
      return toPolicy(firstRow(rows)!);
    },

    async delete(orgId, id) {
      await query(
        `UPDATE lifecycle_policies SET deleted_at = now(), updated_at = now() WHERE org_id = $1 AND id = $2`,
        [orgId, id]
      );
    },

    async listByBusinessId(orgId, businessId) {
      const rows = await query<LifecyclePolicyRow>(
        `SELECT * FROM lifecycle_policies WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL ORDER BY priority DESC`,
        [orgId, businessId]
      );
      return rows.map(toPolicy);
    },

    async listByEvent(orgId, businessId, fromEvent) {
      const rows = await query<LifecyclePolicyRow>(
        `SELECT * FROM lifecycle_policies WHERE org_id = $1 AND business_id = $2 AND from_event = $3 AND is_active = true AND deleted_at IS NULL ORDER BY priority DESC`,
        [orgId, businessId, fromEvent]
      );
      return rows.map(toPolicy);
    },
  };
}
