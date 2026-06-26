import type { RecommendationPriority } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { RecommendationPriorityRepository } from "../types.js";

interface PriorityRow {
  id: string;
  org_id: string;
  recommendation_instance_id: string;
  priority: RecommendationPriority["priority"];
  rank: number;
  computed_at: string;
  created_at: string;
  updated_at: string;
}

function toPriority(row: PriorityRow): RecommendationPriority {
  return {
    id: row.id,
    orgId: row.org_id,
    recommendationId: row.recommendation_instance_id,
    priority: row.priority,
    rank: row.rank,
    computedAt: row.computed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: null,
  };
}

export function createPostgresRecommendationPriorityRepository(): RecommendationPriorityRepository {
  return {
    async upsert(input) {
      const rows = await query<PriorityRow>(
        `INSERT INTO recommendation_priorities (org_id, recommendation_instance_id, priority, rank, computed_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (recommendation_instance_id) DO UPDATE SET
           priority = EXCLUDED.priority,
           rank = EXCLUDED.rank,
           computed_at = EXCLUDED.computed_at,
           updated_at = now()
         RETURNING *`,
        [input.orgId, input.recommendationId, input.priority, input.rank, input.computedAt]
      );
      return toPriority(firstRow(rows));
    },
    async listByBusinessId(orgId, businessId) {
      const rows = await query<PriorityRow>(
        `SELECT rp.* FROM recommendation_priorities rp
         JOIN recommendation_instances ri ON ri.id = rp.recommendation_instance_id
         WHERE rp.org_id = $1 AND ri.business_id = $2 AND ri.deleted_at IS NULL
         ORDER BY rp.rank`,
        [orgId, businessId]
      );
      return rows.map(toPriority);
    },
  };
}
