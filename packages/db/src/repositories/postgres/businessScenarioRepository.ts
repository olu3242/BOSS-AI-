import type { BusinessScenario, ScenarioStatus, ScenarioAssumption, ScenarioComparison } from "@boss/types";
import { query } from "../../client.js";
import type { BusinessScenarioRepository } from "../types.js";

interface ScenarioRow {
  id: string;
  org_id: string;
  business_id: string;
  scenario_type: string;
  objective: string;
  assumptions: ScenarioAssumption[];
  affected_domains: string[];
  projected_revenue: string;
  projected_cost: string;
  projected_profit: string;
  operational_impact: string;
  customer_impact: string;
  risk_level: string;
  confidence_score: string;
  forecast_period: string;
  version: number;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface ComparisonRow {
  id: string;
  org_id: string;
  business_id: string;
  scenario_ids: string[];
  recommended_scenario_id: string;
  rationale: string;
  created_at: string;
}

function toScenario(row: ScenarioRow): BusinessScenario {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    scenarioType: row.scenario_type as BusinessScenario["scenarioType"],
    objective: row.objective,
    assumptions: row.assumptions,
    affectedDomains: row.affected_domains,
    projectedRevenue: parseFloat(row.projected_revenue),
    projectedCost: parseFloat(row.projected_cost),
    projectedProfit: parseFloat(row.projected_profit),
    operationalImpact: row.operational_impact as BusinessScenario["operationalImpact"],
    customerImpact: row.customer_impact as BusinessScenario["customerImpact"],
    riskLevel: row.risk_level as BusinessScenario["riskLevel"],
    confidenceScore: parseFloat(row.confidence_score),
    forecastPeriod: row.forecast_period as BusinessScenario["forecastPeriod"],
    version: row.version,
    status: row.status as ScenarioStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function toComparison(row: ComparisonRow): ScenarioComparison {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    scenarioIds: row.scenario_ids,
    recommendedScenarioId: row.recommended_scenario_id,
    rationale: row.rationale,
    createdAt: row.created_at,
  };
}

export function createPostgresBusinessScenarioRepository(): BusinessScenarioRepository {
  return {
    async create(input) {
      const rows = await query<ScenarioRow>(
        `INSERT INTO business_scenarios
          (org_id, business_id, scenario_type, objective, assumptions, affected_domains,
           projected_revenue, projected_cost, projected_profit,
           operational_impact, customer_impact, risk_level,
           confidence_score, forecast_period, version, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         RETURNING *`,
        [
          input.orgId, input.businessId, input.scenarioType, input.objective,
          JSON.stringify(input.assumptions), JSON.stringify(input.affectedDomains),
          input.projectedRevenue, input.projectedCost, input.projectedProfit,
          input.operationalImpact, input.customerImpact, input.riskLevel,
          input.confidenceScore, input.forecastPeriod, input.version, input.status,
        ]
      );
      return toScenario(rows[0]!);
    },

    async findById(orgId, id) {
      const rows = await query<ScenarioRow>(
        `SELECT * FROM business_scenarios WHERE org_id=$1 AND id=$2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      return rows[0] ? toScenario(rows[0]) : null;
    },

    async update(orgId, id, patch) {
      const rows = await query<ScenarioRow>(
        `UPDATE business_scenarios SET
           status             = COALESCE($3, status),
           projected_revenue  = COALESCE($4, projected_revenue),
           projected_cost     = COALESCE($5, projected_cost),
           projected_profit   = COALESCE($6, projected_profit),
           confidence_score   = COALESCE($7, confidence_score),
           risk_level         = COALESCE($8, risk_level),
           operational_impact = COALESCE($9, operational_impact),
           customer_impact    = COALESCE($10, customer_impact),
           updated_at         = now()
         WHERE org_id=$1 AND id=$2 AND deleted_at IS NULL
         RETURNING *`,
        [
          orgId, id,
          patch.status ?? null,
          patch.projectedRevenue ?? null,
          patch.projectedCost ?? null,
          patch.projectedProfit ?? null,
          patch.confidenceScore ?? null,
          patch.riskLevel ?? null,
          patch.operationalImpact ?? null,
          patch.customerImpact ?? null,
        ]
      );
      return toScenario(rows[0]!);
    },

    async listByBusinessId(orgId, businessId) {
      const rows = await query<ScenarioRow>(
        `SELECT * FROM business_scenarios WHERE org_id=$1 AND business_id=$2 AND deleted_at IS NULL ORDER BY created_at DESC`,
        [orgId, businessId]
      );
      return rows.map(toScenario);
    },

    async createComparison(input) {
      const rows = await query<ComparisonRow>(
        `INSERT INTO scenario_comparisons (org_id, business_id, scenario_ids, recommended_scenario_id, rationale)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [
          input.orgId, input.businessId,
          JSON.stringify(input.scenarioIds),
          input.recommendedScenarioId,
          input.rationale,
        ]
      );
      return toComparison(rows[0]!);
    },

    async listComparisons(orgId, businessId) {
      const rows = await query<ComparisonRow>(
        `SELECT * FROM scenario_comparisons WHERE org_id=$1 AND business_id=$2 ORDER BY created_at DESC`,
        [orgId, businessId]
      );
      return rows.map(toComparison);
    },
  };
}
