import type { BusinessDNA } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { BusinessDnaRepository } from "../types.js";

interface DnaRow {
  id: string;
  org_id: string;
  business_id: string;
  archetype: BusinessDNA["archetype"];
  growth_stage: BusinessDNA["growthStage"];
  operational_complexity: BusinessDNA["operationalComplexity"];
  technology_maturity: BusinessDNA["technologyMaturity"];
  automation_readiness: BusinessDNA["automationReadiness"];
  customer_engagement_style: BusinessDNA["customerEngagementStyle"];
  revenue_model: BusinessDNA["revenueModel"];
  communication_style: BusinessDNA["communicationStyle"];
  decision_style: BusinessDNA["decisionStyle"];
  risk_profile: BusinessDNA["riskProfile"];
  generated_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toDna(row: DnaRow): BusinessDNA {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    archetype: row.archetype,
    growthStage: row.growth_stage,
    operationalComplexity: row.operational_complexity,
    technologyMaturity: row.technology_maturity,
    automationReadiness: row.automation_readiness,
    customerEngagementStyle: row.customer_engagement_style,
    revenueModel: row.revenue_model,
    communicationStyle: row.communication_style,
    decisionStyle: row.decision_style,
    riskProfile: row.risk_profile,
    generatedAt: row.generated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresBusinessDnaRepository(): BusinessDnaRepository {
  return {
    async upsert(input) {
      const rows = await query<DnaRow>(
        `INSERT INTO business_dna
           (org_id, business_id, archetype, growth_stage, operational_complexity, technology_maturity,
            automation_readiness, customer_engagement_style, revenue_model, communication_style, decision_style,
            risk_profile, generated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (business_id) DO UPDATE SET
           archetype = EXCLUDED.archetype,
           growth_stage = EXCLUDED.growth_stage,
           operational_complexity = EXCLUDED.operational_complexity,
           technology_maturity = EXCLUDED.technology_maturity,
           automation_readiness = EXCLUDED.automation_readiness,
           customer_engagement_style = EXCLUDED.customer_engagement_style,
           revenue_model = EXCLUDED.revenue_model,
           communication_style = EXCLUDED.communication_style,
           decision_style = EXCLUDED.decision_style,
           risk_profile = EXCLUDED.risk_profile,
           generated_at = EXCLUDED.generated_at,
           updated_at = now()
         RETURNING *`,
        [
          input.orgId,
          input.businessId,
          input.archetype,
          input.growthStage,
          input.operationalComplexity,
          input.technologyMaturity,
          input.automationReadiness,
          input.customerEngagementStyle,
          input.revenueModel,
          input.communicationStyle,
          input.decisionStyle,
          input.riskProfile,
          input.generatedAt,
        ]
      );
      return toDna(firstRow(rows));
    },
    async findByBusinessId(orgId, businessId) {
      const rows = await query<DnaRow>(
        `SELECT * FROM business_dna WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL`,
        [orgId, businessId]
      );
      return rows[0] ? toDna(rows[0]) : null;
    },
  };
}
