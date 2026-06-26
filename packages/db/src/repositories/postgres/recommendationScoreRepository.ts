import type { RecommendationScore } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { RecommendationScoreRepository } from "../types.js";

interface ScoreRow {
  id: string;
  org_id: string;
  recommendation_instance_id: string;
  priority_score: string;
  business_value_score: string;
  implementation_score: string;
  strategic_score: string;
  overall_score: string;
  created_at: string;
  updated_at: string;
}

function toScore(row: ScoreRow): RecommendationScore {
  return {
    id: row.id,
    orgId: row.org_id,
    recommendationId: row.recommendation_instance_id,
    priorityScore: Number(row.priority_score),
    businessValueScore: Number(row.business_value_score),
    implementationScore: Number(row.implementation_score),
    strategicScore: Number(row.strategic_score),
    overallScore: Number(row.overall_score),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: null,
  };
}

export function createPostgresRecommendationScoreRepository(): RecommendationScoreRepository {
  return {
    async upsert(input) {
      const rows = await query<ScoreRow>(
        `INSERT INTO recommendation_scores
           (org_id, recommendation_instance_id, priority_score, business_value_score,
            implementation_score, strategic_score, overall_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (recommendation_instance_id) DO UPDATE SET
           priority_score = EXCLUDED.priority_score,
           business_value_score = EXCLUDED.business_value_score,
           implementation_score = EXCLUDED.implementation_score,
           strategic_score = EXCLUDED.strategic_score,
           overall_score = EXCLUDED.overall_score,
           updated_at = now()
         RETURNING *`,
        [
          input.orgId,
          input.recommendationId,
          input.priorityScore,
          input.businessValueScore,
          input.implementationScore,
          input.strategicScore,
          input.overallScore,
        ]
      );
      return toScore(firstRow(rows));
    },
    async findByRecommendationId(orgId, recommendationId) {
      const rows = await query<ScoreRow>(
        `SELECT * FROM recommendation_scores WHERE org_id = $1 AND recommendation_instance_id = $2`,
        [orgId, recommendationId]
      );
      return rows[0] ? toScore(rows[0]) : null;
    },
  };
}
