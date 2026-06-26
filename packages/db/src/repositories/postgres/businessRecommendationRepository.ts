import type { BusinessRecommendation, RecommendationEvidenceItem } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { BusinessRecommendationRepository, StoredRecommendationEvidence } from "../types.js";

interface RecommendationRow {
  id: string;
  org_id: string;
  business_id: string;
  definition_key: string;
  title: string;
  description: string;
  business_goal: string;
  category_key: string;
  expected_outcome: string;
  difficulty: BusinessRecommendation["difficulty"];
  estimated_effort_hours: string;
  estimated_cost: string;
  estimated_time_to_value_days: string;
  confidence: string;
  related_capabilities: string[];
  related_kpi_keys: string[];
  dependencies: string[];
  approval: BusinessRecommendation["approval"];
  stage: BusinessRecommendation["stage"];
  status: BusinessRecommendation["status"];
  date_recommended: string;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface RoiRow {
  revenue_increase_annual: string;
  time_saved_hours_weekly: string;
  administrative_reduction_hours: string;
  customer_retention_increase_pct: string;
  lead_conversion_improvement_pct: string;
  profit_impact_annual: string;
  owner_time_saved_hours_weekly: string;
  risk_reduction: "low" | "medium" | "high";
  confidence: string;
}

interface EvidenceRow {
  id: string;
  recommendation_instance_id: string;
  source: RecommendationEvidenceItem["source"];
  description: string;
  data: Record<string, unknown>;
  created_at: string;
}

function toRecommendation(
  row: RecommendationRow,
  roi: RoiRow | undefined,
  evidence: RecommendationEvidenceItem[],
): BusinessRecommendation {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    definitionKey: row.definition_key,
    title: row.title,
    description: row.description,
    businessGoal: row.business_goal,
    category: row.category_key as BusinessRecommendation["category"],
    relatedCapabilities: row.related_capabilities,
    relatedConstraintIds: [],
    relatedKpiKeys: row.related_kpi_keys,
    expectedOutcome: row.expected_outcome,
    difficulty: row.difficulty,
    estimatedEffortHours: Number(row.estimated_effort_hours),
    estimatedCost: Number(row.estimated_cost),
    estimatedRoi: roi
      ? {
          revenueIncreaseAnnual: Number(roi.revenue_increase_annual),
          timeSavedHoursWeekly: Number(roi.time_saved_hours_weekly),
          administrativeReductionHours: Number(roi.administrative_reduction_hours),
          customerRetentionIncreasePct: Number(roi.customer_retention_increase_pct),
          leadConversionImprovementPct: Number(roi.lead_conversion_improvement_pct),
          profitImpactAnnual: Number(roi.profit_impact_annual),
          ownerTimeSavedHoursWeekly: Number(roi.owner_time_saved_hours_weekly),
          riskReduction: roi.risk_reduction,
          confidence: Number(roi.confidence),
        }
      : {
          revenueIncreaseAnnual: 0,
          timeSavedHoursWeekly: 0,
          administrativeReductionHours: 0,
          customerRetentionIncreasePct: 0,
          leadConversionImprovementPct: 0,
          profitImpactAnnual: 0,
          ownerTimeSavedHoursWeekly: 0,
          riskReduction: "low",
          confidence: 0,
        },
    estimatedTimeToValueDays: Number(row.estimated_time_to_value_days),
    confidence: Number(row.confidence),
    evidence,
    dependencies: row.dependencies,
    approval: row.approval,
    stage: row.stage,
    status: row.status,
    dateRecommended: row.date_recommended,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function toEvidence(row: EvidenceRow): StoredRecommendationEvidence {
  return {
    id: row.id,
    recommendationId: row.recommendation_instance_id,
    source: row.source,
    description: row.description,
    data: row.data,
    createdAt: row.created_at,
  };
}

export function createPostgresBusinessRecommendationRepository(): BusinessRecommendationRepository {
  return {
    async create(input) {
      const rows = await query<RecommendationRow>(
        `INSERT INTO recommendation_instances
           (org_id, business_id, definition_key, title, description, business_goal, category_key,
            expected_outcome, difficulty, estimated_effort_hours, estimated_cost, estimated_time_to_value_days,
            confidence, related_capabilities, related_kpi_keys, dependencies, approval, stage, status, date_recommended, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
         RETURNING *`,
        [
          input.orgId,
          input.businessId,
          input.definitionKey,
          input.title,
          input.description,
          input.businessGoal,
          input.category,
          input.expectedOutcome,
          input.difficulty,
          input.estimatedEffortHours,
          input.estimatedCost,
          input.estimatedTimeToValueDays,
          input.confidence,
          JSON.stringify(input.relatedCapabilities),
          JSON.stringify(input.relatedKpiKeys),
          JSON.stringify(input.dependencies),
          input.approval,
          input.stage,
          input.status,
          input.dateRecommended,
          input.version,
        ]
      );
      const row = firstRow(rows);
      await query(
        `INSERT INTO recommendation_roi_estimates
           (org_id, recommendation_instance_id, revenue_increase_annual, time_saved_hours_weekly,
            administrative_reduction_hours, customer_retention_increase_pct, lead_conversion_improvement_pct,
            profit_impact_annual, owner_time_saved_hours_weekly, risk_reduction, confidence)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          input.orgId,
          row.id,
          input.estimatedRoi.revenueIncreaseAnnual,
          input.estimatedRoi.timeSavedHoursWeekly,
          input.estimatedRoi.administrativeReductionHours,
          input.estimatedRoi.customerRetentionIncreasePct,
          input.estimatedRoi.leadConversionImprovementPct,
          input.estimatedRoi.profitImpactAnnual,
          input.estimatedRoi.ownerTimeSavedHoursWeekly,
          input.estimatedRoi.riskReduction,
          input.estimatedRoi.confidence,
        ]
      );
      for (const constraintId of input.relatedConstraintIds) {
        await query(
          `INSERT INTO recommendation_constraint_links (org_id, recommendation_instance_id, constraint_instance_id)
           VALUES ($1, $2, $3)`,
          [input.orgId, row.id, constraintId]
        );
      }
      return toRecommendation(row, undefined, []);
    },
    async listByBusinessId(orgId, businessId) {
      const rows = await query<RecommendationRow>(
        `SELECT * FROM recommendation_instances WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL ORDER BY created_at`,
        [orgId, businessId]
      );
      const result: BusinessRecommendation[] = [];
      for (const row of rows) {
        result.push(await hydrate(row));
      }
      return result;
    },
    async findById(orgId, id) {
      const rows = await query<RecommendationRow>(
        `SELECT * FROM recommendation_instances WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      const row = rows[0];
      if (!row) return null;
      return hydrate(row);
    },
    async updateStatus(orgId, id, status) {
      const rows = await query<RecommendationRow>(
        `UPDATE recommendation_instances SET status = $3, updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [orgId, id, status]
      );
      return hydrate(firstRow(rows));
    },
    async addEvidence(recommendationId, evidence) {
      const rows = await query<EvidenceRow>(
        `INSERT INTO recommendation_evidence (org_id, recommendation_instance_id, source, description, data)
         VALUES ((SELECT org_id FROM recommendation_instances WHERE id = $1), $1, $2, $3, $4)
         RETURNING *`,
        [recommendationId, evidence.source, evidence.description, JSON.stringify(evidence.data)]
      );
      return toEvidence(firstRow(rows));
    },
    async listEvidence(recommendationId) {
      const rows = await query<EvidenceRow>(
        `SELECT * FROM recommendation_evidence WHERE recommendation_instance_id = $1 ORDER BY created_at`,
        [recommendationId]
      );
      return rows.map(toEvidence);
    },
    async recordHistory(recommendationId, previousStatus, newStatus, note) {
      await query(
        `INSERT INTO recommendation_history (org_id, recommendation_instance_id, previous_status, new_status, note)
         VALUES ((SELECT org_id FROM recommendation_instances WHERE id = $1), $1, $2, $3, $4)`,
        [recommendationId, previousStatus, newStatus, note]
      );
    },
  };

  async function hydrate(row: RecommendationRow): Promise<BusinessRecommendation> {
    const roiRows = await query<RoiRow>(
      `SELECT * FROM recommendation_roi_estimates WHERE recommendation_instance_id = $1`,
      [row.id]
    );
    const evidenceRows = await query<EvidenceRow>(
      `SELECT * FROM recommendation_evidence WHERE recommendation_instance_id = $1 ORDER BY created_at`,
      [row.id]
    );
    const recommendation = toRecommendation(row, roiRows[0], evidenceRows.map(toEvidence));
    const linkRows = await query<{ constraint_instance_id: string }>(
      `SELECT constraint_instance_id FROM recommendation_constraint_links WHERE recommendation_instance_id = $1`,
      [row.id]
    );
    recommendation.relatedConstraintIds = linkRows.map((r) => r.constraint_instance_id);
    return recommendation;
  }
}
