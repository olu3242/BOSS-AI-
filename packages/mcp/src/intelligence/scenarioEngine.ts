import type {
  BusinessScenario,
  ScenarioType,
  ForecastPeriod,
  ScenarioAssumption,
  DecisionImpactLevel,
} from "@boss/types";

export interface ScenarioInput {
  orgId: string;
  businessId: string;
  scenarioType: ScenarioType;
  objective: string;
  baseRevenue: number;
  baseProfit: number;
  employeeCount: number;
  assumptions: ScenarioAssumption[];
  forecastPeriod: ForecastPeriod;
}

export interface CalculatedScenario {
  projectedRevenue: number;
  projectedCost: number;
  projectedProfit: number;
  operationalImpact: DecisionImpactLevel;
  customerImpact: DecisionImpactLevel;
  riskLevel: DecisionImpactLevel;
  confidenceScore: number;
  affectedDomains: string[];
}

const FORECAST_MULTIPLIER: Record<ForecastPeriod, number> = {
  "30d": 1 / 12,
  "90d": 0.25,
  "180d": 0.5,
  "365d": 1,
};

function getAssumptionValue(assumptions: ScenarioAssumption[], key: string, defaultValue: number): number {
  return assumptions.find((a) => a.key === key)?.value ?? defaultValue;
}

/**
 * Deterministic simulation per scenario type.
 * LLM reasoning may explain results but never drives the calculations (Law 1).
 */
export function calculateScenario(input: ScenarioInput): CalculatedScenario {
  const periodFactor = FORECAST_MULTIPLIER[input.forecastPeriod];
  const base = input.baseRevenue * periodFactor;

  switch (input.scenarioType) {
    case "revenue": {
      const growthPct = getAssumptionValue(input.assumptions, "revenue_growth_pct", 10) / 100;
      const projectedRevenue = base * (1 + growthPct);
      const projectedCost = base * 0.6;
      return {
        projectedRevenue,
        projectedCost,
        projectedProfit: projectedRevenue - projectedCost,
        operationalImpact: "low",
        customerImpact: "medium",
        riskLevel: growthPct > 0.3 ? "high" : "low",
        confidenceScore: 0.75,
        affectedDomains: ["revenue", "sales"],
      };
    }

    case "marketing": {
      const budgetIncreasePct = getAssumptionValue(input.assumptions, "budget_increase_pct", 20) / 100;
      const leadLiftPct = getAssumptionValue(input.assumptions, "lead_lift_pct", 15) / 100;
      const additionalCost = base * budgetIncreasePct;
      const revenueUplift = base * leadLiftPct * 0.3;
      return {
        projectedRevenue: base + revenueUplift,
        projectedCost: base * 0.6 + additionalCost,
        projectedProfit: revenueUplift - additionalCost,
        operationalImpact: "low",
        customerImpact: "high",
        riskLevel: "medium",
        confidenceScore: 0.65,
        affectedDomains: ["marketing", "sales", "customer_experience"],
      };
    }

    case "hiring": {
      const headcount = getAssumptionValue(input.assumptions, "new_headcount", 2);
      const avgSalary = getAssumptionValue(input.assumptions, "avg_salary_annual", 60000);
      const productivityGain = getAssumptionValue(input.assumptions, "productivity_gain_pct", 10) / 100;
      const cost = headcount * avgSalary * periodFactor;
      const gain = base * productivityGain;
      return {
        projectedRevenue: base + gain,
        projectedCost: base * 0.6 + cost,
        projectedProfit: gain - cost,
        operationalImpact: "medium",
        customerImpact: "medium",
        riskLevel: cost > gain ? "high" : "medium",
        confidenceScore: 0.7,
        affectedDomains: ["operations", "hiring", "productivity"],
      };
    }

    case "pricing": {
      const priceLiftPct = getAssumptionValue(input.assumptions, "price_lift_pct", 10) / 100;
      const churnRisk = getAssumptionValue(input.assumptions, "churn_risk_pct", 5) / 100;
      const uplift = base * priceLiftPct * (1 - churnRisk);
      return {
        projectedRevenue: base + uplift,
        projectedCost: base * 0.6,
        projectedProfit: uplift,
        operationalImpact: "low",
        customerImpact: churnRisk > 0.1 ? "high" : "medium",
        riskLevel: churnRisk > 0.15 ? "high" : "medium",
        confidenceScore: 0.6,
        affectedDomains: ["pricing", "revenue", "customer_retention"],
      };
    }

    case "expansion": {
      const locationCost = getAssumptionValue(input.assumptions, "location_cost_annual", 100000);
      const revenuePerLocation = getAssumptionValue(input.assumptions, "revenue_per_location", 200000);
      const cost = locationCost * periodFactor;
      const gain = revenuePerLocation * periodFactor;
      return {
        projectedRevenue: base + gain,
        projectedCost: base * 0.6 + cost,
        projectedProfit: gain - cost,
        operationalImpact: "high",
        customerImpact: "medium",
        riskLevel: "high",
        confidenceScore: 0.55,
        affectedDomains: ["expansion", "operations", "finance"],
      };
    }

    case "finance": {
      const costReductionPct = getAssumptionValue(input.assumptions, "cost_reduction_pct", 10) / 100;
      const savings = base * 0.6 * costReductionPct;
      return {
        projectedRevenue: base,
        projectedCost: base * 0.6 * (1 - costReductionPct),
        projectedProfit: input.baseProfit * periodFactor + savings,
        operationalImpact: "medium",
        customerImpact: "low",
        riskLevel: "low",
        confidenceScore: 0.8,
        affectedDomains: ["finance", "operations"],
      };
    }

    default: {
      return {
        projectedRevenue: base,
        projectedCost: base * 0.6,
        projectedProfit: base * 0.4,
        operationalImpact: "low",
        customerImpact: "low",
        riskLevel: "low",
        confidenceScore: 0.5,
        affectedDomains: ["operations"],
      };
    }
  }
}

export interface ForecastResult {
  period: ForecastPeriod;
  projectedRevenue: number;
  projectedCost: number;
  projectedProfit: number;
  growthRate: number;
  confidenceScore: number;
}

export function generateForecast(
  baseRevenue: number,
  baseProfit: number,
  healthScore: number,
  periods: ForecastPeriod[] = ["30d", "90d", "180d", "365d"]
): ForecastResult[] {
  const growthRate = Math.max(-0.2, Math.min(0.4, (healthScore - 50) / 200));
  return periods.map((period) => {
    const factor = FORECAST_MULTIPLIER[period];
    const revenue = baseRevenue * factor * (1 + growthRate * factor);
    const cost = revenue * 0.6;
    return {
      period,
      projectedRevenue: Math.round(revenue),
      projectedCost: Math.round(cost),
      projectedProfit: Math.round(revenue - cost),
      growthRate: Math.round(growthRate * 10000) / 100,
      confidenceScore: Math.round((0.9 - factor * 0.15) * 100) / 100,
    };
  });
}

export interface ScenarioComparisonResult {
  recommendedScenarioId: string;
  rationale: string;
  ranking: Array<{ scenarioId: string; score: number; reason: string }>;
}

export function compareScenarios(scenarios: BusinessScenario[]): ScenarioComparisonResult {
  if (scenarios.length === 0) {
    return { recommendedScenarioId: "", rationale: "No scenarios to compare", ranking: [] };
  }

  const scored = scenarios.map((s) => {
    const roi = s.projectedProfit / Math.max(1, s.projectedCost);
    const riskMultiplier = { low: 1, medium: 0.85, high: 0.65, critical: 0.4 }[s.riskLevel] ?? 0.5;
    const score = roi * s.confidenceScore * riskMultiplier * 100;
    const reason = `ROI ${(roi * 100).toFixed(1)}%, confidence ${(s.confidenceScore * 100).toFixed(0)}%, risk ${s.riskLevel}`;
    return { scenarioId: s.id, score: Math.round(score * 10) / 10, reason };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]!;
  const bestScenario = scenarios.find((s) => s.id === best.scenarioId)!;

  return {
    recommendedScenarioId: best.scenarioId,
    rationale: `"${bestScenario.objective}" scores highest (${best.score.toFixed(1)}) after applying ROI × confidence × risk weighting across ${scenarios.length} scenario(s).`,
    ranking: scored,
  };
}
