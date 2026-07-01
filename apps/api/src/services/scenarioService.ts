import { nowIso } from "@boss/shared";
import { calculateScenario, compareScenarios, generateForecast } from "@boss/mcp";
import type { BusinessScenario, ForecastPeriod, ScenarioAssumption, ScenarioType } from "@boss/types";
import type { RepositoryContainer } from "../container.js";
import type { ForecastResult } from "@boss/mcp";

export interface CreateScenarioInput {
  scenarioType: ScenarioType;
  objective: string;
  assumptions: ScenarioAssumption[];
  forecastPeriod: ForecastPeriod;
}

export interface CompareScenarioInput {
  scenarioIds: string[];
}

export interface ScenarioService {
  create(orgId: string, businessId: string, input: CreateScenarioInput): Promise<BusinessScenario>;
  list(orgId: string, businessId: string): Promise<BusinessScenario[]>;
  compare(orgId: string, businessId: string, input: CompareScenarioInput): Promise<{ comparison: Awaited<ReturnType<typeof compareScenarios>>; scenarios: BusinessScenario[] }>;
  getForecast(orgId: string, businessId: string, periods?: ForecastPeriod[]): Promise<ForecastResult[]>;
}

export function createScenarioService(repos: RepositoryContainer): ScenarioService {
  return {
    async create(orgId, businessId, input) {
      const [business, profile] = await Promise.all([
        repos.businesses.findById(orgId, businessId),
        repos.businessProfiles.findByBusinessId(orgId, businessId),
      ]);

      const baseRevenue = business?.annualRevenue ?? 0;
      const baseProfit = baseRevenue * 0.3;

      const calculated = calculateScenario({
        orgId,
        businessId,
        scenarioType: input.scenarioType,
        objective: input.objective,
        baseRevenue,
        baseProfit,
        employeeCount: profile?.employeeCount ?? 1,
        assumptions: input.assumptions,
        forecastPeriod: input.forecastPeriod,
      });

      const scenario = await repos.businessScenarios.create({
        orgId,
        businessId,
        scenarioType: input.scenarioType,
        objective: input.objective,
        assumptions: input.assumptions,
        affectedDomains: calculated.affectedDomains,
        projectedRevenue: calculated.projectedRevenue,
        projectedCost: calculated.projectedCost,
        projectedProfit: calculated.projectedProfit,
        operationalImpact: calculated.operationalImpact,
        customerImpact: calculated.customerImpact,
        riskLevel: calculated.riskLevel,
        confidenceScore: calculated.confidenceScore,
        forecastPeriod: input.forecastPeriod,
        version: 1,
        status: "calculated",
      });

      await repos.eventBus.publish({
        type: "scenario.created",
        payload: { orgId, businessId, scenarioId: scenario.id, scenarioType: input.scenarioType },
        occurredAt: nowIso(),
      });

      return scenario;
    },

    async list(orgId, businessId) {
      return repos.businessScenarios.listByBusinessId(orgId, businessId);
    },

    async compare(orgId, businessId, input) {
      const allScenarios = await repos.businessScenarios.listByBusinessId(orgId, businessId);
      const scenarios = input.scenarioIds.length > 0
        ? allScenarios.filter((s) => input.scenarioIds.includes(s.id))
        : allScenarios;

      if (scenarios.length < 2) {
        throw new Error("At least 2 scenarios are required for comparison");
      }

      const comparison = compareScenarios(scenarios);

      await repos.businessScenarios.createComparison({
        orgId,
        businessId,
        scenarioIds: scenarios.map((s) => s.id),
        recommendedScenarioId: comparison.recommendedScenarioId,
        rationale: comparison.rationale,
      });

      await repos.eventBus.publish({
        type: "scenario.compared",
        payload: { orgId, businessId, scenarioIds: scenarios.map((s) => s.id), recommendedScenarioId: comparison.recommendedScenarioId },
        occurredAt: nowIso(),
      });

      return { comparison, scenarios };
    },

    async getForecast(orgId, businessId, periods) {
      const [health, business] = await Promise.all([
        repos.businessHealth.findByBusinessId(orgId, businessId),
        repos.businesses.findById(orgId, businessId),
      ]);

      const baseRevenue = business?.annualRevenue ?? 0;
      const baseProfit = baseRevenue * 0.3;
      const healthScore = health?.overallScore ?? 50;

      const forecast = generateForecast(baseRevenue, baseProfit, healthScore, periods);

      await repos.eventBus.publish({
        type: "scenario.forecast.generated",
        payload: { orgId, businessId, periods: periods ?? ["30d", "90d", "180d", "365d"] },
        occurredAt: nowIso(),
      });

      return forecast;
    },
  };
}
