import type { BusinessDecision, DecisionStatus, DecisionOption, DecisionImpact } from "@boss/types";
import { query } from "../../client.js";
import type { BusinessDecisionRepository } from "../types.js";

interface DecisionRow {
  id: string;
  org_id: string;
  business_id: string;
  decision_type: string;
  objective: string;
  context: string;
  supporting_recommendation_ids: string[];
  supporting_constraint_ids: string[];
  applied_policy_keys: string[];
  options: DecisionOption[];
  selected_option_key: string | null;
  expected_impact: DecisionImpact;
  expected_roi: string;
  expected_cost: string;
  confidence_score: string;
  status: string;
  approved_at: string | null;
  rejected_at: string | null;
  completed_at: string | null;
  measured_at: string | null;
  actual_roi: string | null;
  lessons_learned: string | null;
  executive_summary: string | null;
  generated_workflow_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toDecision(row: DecisionRow): BusinessDecision {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    decisionType: row.decision_type as BusinessDecision["decisionType"],
    objective: row.objective,
    context: row.context,
    supportingRecommendationIds: row.supporting_recommendation_ids,
    supportingConstraintIds: row.supporting_constraint_ids,
    appliedPolicyKeys: row.applied_policy_keys,
    options: row.options,
    selectedOptionKey: row.selected_option_key,
    expectedImpact: row.expected_impact,
    expectedRoi: parseFloat(row.expected_roi),
    expectedCost: parseFloat(row.expected_cost),
    confidenceScore: parseFloat(row.confidence_score),
    status: row.status as DecisionStatus,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    completedAt: row.completed_at,
    measuredAt: row.measured_at,
    actualRoi: row.actual_roi !== null ? parseFloat(row.actual_roi) : null,
    lessonsLearned: row.lessons_learned,
    executiveSummary: row.executive_summary,
    generatedWorkflowId: row.generated_workflow_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresBusinessDecisionRepository(): BusinessDecisionRepository {
  return {
    async create(input) {
      const rows = await query<DecisionRow>(
        `INSERT INTO business_decisions
          (org_id, business_id, decision_type, objective, context,
           supporting_recommendation_ids, supporting_constraint_ids, applied_policy_keys,
           options, selected_option_key, expected_impact, expected_roi, expected_cost,
           confidence_score, status, approved_at, rejected_at, completed_at, measured_at,
           actual_roi, lessons_learned, executive_summary, generated_workflow_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
         RETURNING *`,
        [
          input.orgId, input.businessId, input.decisionType, input.objective, input.context,
          JSON.stringify(input.supportingRecommendationIds),
          JSON.stringify(input.supportingConstraintIds),
          JSON.stringify(input.appliedPolicyKeys),
          JSON.stringify(input.options),
          input.selectedOptionKey ?? null,
          JSON.stringify(input.expectedImpact),
          input.expectedRoi, input.expectedCost, input.confidenceScore, input.status,
          input.approvedAt ?? null, input.rejectedAt ?? null,
          input.completedAt ?? null, input.measuredAt ?? null,
          input.actualRoi ?? null, input.lessonsLearned ?? null,
          input.executiveSummary ?? null, input.generatedWorkflowId ?? null,
        ]
      );
      return toDecision(rows[0]!);
    },

    async findById(orgId, id) {
      const rows = await query<DecisionRow>(
        `SELECT * FROM business_decisions WHERE org_id=$1 AND id=$2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      return rows[0] ? toDecision(rows[0]) : null;
    },

    async update(orgId, id, patch) {
      const rows = await query<DecisionRow>(
        `UPDATE business_decisions SET
           decision_type         = COALESCE($3, decision_type),
           objective             = COALESCE($4, objective),
           status                = COALESCE($5, status),
           selected_option_key   = COALESCE($6, selected_option_key),
           approved_at           = COALESCE($7, approved_at),
           rejected_at           = COALESCE($8, rejected_at),
           completed_at          = COALESCE($9, completed_at),
           measured_at           = COALESCE($10, measured_at),
           actual_roi            = COALESCE($11, actual_roi),
           lessons_learned       = COALESCE($12, lessons_learned),
           executive_summary     = COALESCE($13, executive_summary),
           generated_workflow_id = COALESCE($14, generated_workflow_id),
           expected_roi          = COALESCE($15, expected_roi),
           expected_cost         = COALESCE($16, expected_cost),
           confidence_score      = COALESCE($17, confidence_score),
           updated_at            = now()
         WHERE org_id=$1 AND id=$2 AND deleted_at IS NULL
         RETURNING *`,
        [
          orgId, id,
          patch.decisionType ?? null,
          patch.objective ?? null,
          patch.status ?? null,
          patch.selectedOptionKey ?? null,
          patch.approvedAt ?? null,
          patch.rejectedAt ?? null,
          patch.completedAt ?? null,
          patch.measuredAt ?? null,
          patch.actualRoi ?? null,
          patch.lessonsLearned ?? null,
          patch.executiveSummary ?? null,
          patch.generatedWorkflowId ?? null,
          patch.expectedRoi ?? null,
          patch.expectedCost ?? null,
          patch.confidenceScore ?? null,
        ]
      );
      return toDecision(rows[0]!);
    },

    async listByBusinessId(orgId, businessId) {
      const rows = await query<DecisionRow>(
        `SELECT * FROM business_decisions WHERE org_id=$1 AND business_id=$2 AND deleted_at IS NULL ORDER BY created_at DESC`,
        [orgId, businessId]
      );
      return rows.map(toDecision);
    },

    async listByStatus(orgId, businessId, status) {
      const rows = await query<DecisionRow>(
        `SELECT * FROM business_decisions WHERE org_id=$1 AND business_id=$2 AND status=$3 AND deleted_at IS NULL ORDER BY created_at DESC`,
        [orgId, businessId, status]
      );
      return rows.map(toDecision);
    },
  };
}
