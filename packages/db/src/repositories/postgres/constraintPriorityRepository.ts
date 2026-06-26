import type { ConstraintPriority } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { ConstraintPriorityRepository } from "../types.js";

interface PriorityRow {
  id: string;
  org_id: string;
  constraint_instance_id: string;
  priority: ConstraintPriority["priority"];
  rank: number;
  computed_at: string;
  created_at: string;
  updated_at: string;
}

function toPriority(row: PriorityRow): ConstraintPriority {
  return {
    id: row.id,
    orgId: row.org_id,
    constraintId: row.constraint_instance_id,
    priority: row.priority,
    rank: row.rank,
    computedAt: row.computed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: null,
  };
}

export function createPostgresConstraintPriorityRepository(): ConstraintPriorityRepository {
  return {
    async upsert(input) {
      const rows = await query<PriorityRow>(
        `INSERT INTO constraint_priorities (org_id, constraint_instance_id, priority, rank, computed_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (constraint_instance_id) DO UPDATE SET
           priority = EXCLUDED.priority,
           rank = EXCLUDED.rank,
           computed_at = EXCLUDED.computed_at,
           updated_at = now()
         RETURNING *`,
        [input.orgId, input.constraintId, input.priority, input.rank, input.computedAt]
      );
      return toPriority(firstRow(rows));
    },
    async listByBusinessId(orgId, businessId) {
      const rows = await query<PriorityRow>(
        `SELECT cp.* FROM constraint_priorities cp
         JOIN constraint_instances ci ON ci.id = cp.constraint_instance_id
         WHERE cp.org_id = $1 AND ci.business_id = $2 AND ci.deleted_at IS NULL
         ORDER BY cp.rank`,
        [orgId, businessId]
      );
      return rows.map(toPriority);
    },
  };
}
