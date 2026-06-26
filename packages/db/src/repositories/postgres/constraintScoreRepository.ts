import type { ConstraintScore } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { ConstraintScoreRepository } from "../types.js";

interface ScoreRow {
  id: string;
  org_id: string;
  constraint_instance_id: string;
  business_impact_score: string;
  financial_impact_score: string;
  customer_impact_score: string;
  urgency_score: string;
  automation_score: string;
  confidence_score: string;
  overall_score: string;
  created_at: string;
  updated_at: string;
}

function toScore(row: ScoreRow): ConstraintScore {
  return {
    id: row.id,
    orgId: row.org_id,
    constraintId: row.constraint_instance_id,
    businessImpactScore: Number(row.business_impact_score),
    financialImpactScore: Number(row.financial_impact_score),
    customerImpactScore: Number(row.customer_impact_score),
    urgencyScore: Number(row.urgency_score),
    automationScore: Number(row.automation_score),
    confidenceScore: Number(row.confidence_score),
    overallScore: Number(row.overall_score),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: null,
  };
}

export function createPostgresConstraintScoreRepository(): ConstraintScoreRepository {
  return {
    async upsert(input) {
      const rows = await query<ScoreRow>(
        `INSERT INTO constraint_scores
           (org_id, constraint_instance_id, business_impact_score, financial_impact_score,
            customer_impact_score, urgency_score, automation_score, confidence_score, overall_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (constraint_instance_id) DO UPDATE SET
           business_impact_score = EXCLUDED.business_impact_score,
           financial_impact_score = EXCLUDED.financial_impact_score,
           customer_impact_score = EXCLUDED.customer_impact_score,
           urgency_score = EXCLUDED.urgency_score,
           automation_score = EXCLUDED.automation_score,
           confidence_score = EXCLUDED.confidence_score,
           overall_score = EXCLUDED.overall_score,
           updated_at = now()
         RETURNING *`,
        [
          input.orgId,
          input.constraintId,
          input.businessImpactScore,
          input.financialImpactScore,
          input.customerImpactScore,
          input.urgencyScore,
          input.automationScore,
          input.confidenceScore,
          input.overallScore,
        ]
      );
      return toScore(firstRow(rows));
    },
    async findByConstraintId(orgId, constraintId) {
      const rows = await query<ScoreRow>(
        `SELECT * FROM constraint_scores WHERE org_id = $1 AND constraint_instance_id = $2`,
        [orgId, constraintId]
      );
      return rows[0] ? toScore(rows[0]) : null;
    },
  };
}
