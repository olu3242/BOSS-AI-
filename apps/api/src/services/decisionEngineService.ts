/**
 * Decision Engine — canonical convergence layer for all intelligence outputs.
 *
 * Converges: Recommendation Engine + Root Cause Analysis + Forecasting + Risk + Priority
 * into a single Decision Engine output.
 *
 * No direct intelligence logic here — routes through existing services.
 * Outputs: recommendations + risk + expected impact + confidence + priority ranking.
 */
import { randomUUID } from "node:crypto";
import { createBossEvent, type EventBus } from "@boss/events";
import type { DecisionEngineResult, DecisionEngineOutput, DecisionEngineOutputType, ObjectivePriority } from "@boss/types";
import type { KpiPlatformService } from "./kpiPlatformService.js";
import type { BusinessRecommendationService } from "./businessRecommendationService.js";
import type { RootCauseService } from "./rootCauseService.js";
import type { ScenarioService } from "./scenarioService.js";
import type { RepositoryContainer } from "../container.js";

export interface DecisionEngineService {
  run(orgId: string, businessId: string): Promise<DecisionEngineResult>;
  getLatest(orgId: string, businessId: string): Promise<DecisionEngineResult | null>;
}

function priorityFromScore(score: number): ObjectivePriority {
  if (score >= 0.8) return "critical";
  if (score >= 0.6) return "high";
  if (score >= 0.4) return "medium";
  return "low";
}

function riskProfile(outputs: DecisionEngineOutput[]): DecisionEngineResult["riskProfile"] {
  const maxRisk = Math.max(0, ...outputs.map((o) => o.riskScore));
  if (maxRisk >= 0.8) return "critical";
  if (maxRisk >= 0.6) return "high";
  if (maxRisk >= 0.4) return "medium";
  return "low";
}

export function createDecisionEngineService(
  repos: RepositoryContainer,
  eventBus: EventBus,
  kpiPlatform: KpiPlatformService,
  recommendationService: BusinessRecommendationService,
  rootCauseService: RootCauseService,
  scenarioService: ScenarioService,
): DecisionEngineService {
  const cache = new Map<string, DecisionEngineResult>();

  return {
    async run(orgId, businessId) {
      const runAt = new Date().toISOString();
      const outputs: DecisionEngineOutput[] = [];

      // 1. KPI signals
      const kpis = await kpiPlatform.list(orgId, businessId);
      const criticalKpis = kpis.filter((k) => k.status === "critical" || k.trend === "declining");
      for (const kpi of criticalKpis.slice(0, 5)) {
        outputs.push({
          id: randomUUID(),
          orgId,
          businessId,
          type: "risk" as DecisionEngineOutputType,
          title: `KPI at risk: ${kpi.label}`,
          summary: `${kpi.label} is ${kpi.trend} (current: ${kpi.currentValue} ${kpi.unit})`,
          priority: priorityFromScore(kpi.status === "critical" ? 0.9 : 0.6),
          expectedImpact: "Addressing this KPI could improve business health score by 5-15 points",
          confidence: kpi.confidence,
          riskScore: kpi.status === "critical" ? 0.85 : 0.55,
          linkedKpis: [kpi.kpiKey],
          linkedObjectiveIds: kpi.linkedObjectiveIds,
          linkedRecommendationId: null,
          source: "kpi-platform",
          createdAt: runAt,
          expiresAt: null,
        });
      }

      // 2. Recommendations
      const recs = await recommendationService.list(orgId, businessId);
      const activeRecs = recs.filter((r) => r.status !== "dismissed" && r.status !== "rejected").slice(0, 5);
      for (const rec of activeRecs) {
        outputs.push({
          id: randomUUID(),
          orgId,
          businessId,
          type: "recommendation" as DecisionEngineOutputType,
          title: rec.title,
          summary: rec.description,
          priority: "medium" as ObjectivePriority,
          expectedImpact: rec.expectedOutcome ?? "Impact not estimated",
          confidence: rec.confidence,
          riskScore: 0.3,
          linkedKpis: rec.relatedKpiKeys ?? [],
          linkedObjectiveIds: [],
          linkedRecommendationId: rec.id,
          source: "recommendation-engine",
          createdAt: runAt,
          expiresAt: null,
        });
      }

      // 3. Root cause signals
      try {
        const rcaContext = await repos.businessHealth.findByBusinessId(orgId, businessId);
        if (rcaContext) {
          const rca = await rootCauseService.analyze(orgId, businessId);
          if (rca.primaryRootCause) {
            outputs.push({
              id: randomUUID(),
              orgId,
              businessId,
              type: "root_cause" as DecisionEngineOutputType,
              title: `Root cause identified: ${rca.primaryRootCause}`,
              summary: rca.summary,
              priority: "high",
              expectedImpact: "Resolving root cause could unblock multiple downstream KPIs",
              confidence: 0.75,
              riskScore: 0.6,
              linkedKpis: [],
              linkedObjectiveIds: [],
              linkedRecommendationId: null,
              source: "root-cause-engine",
              createdAt: runAt,
              expiresAt: null,
            });
          }
        }
      } catch {
        // Root cause analysis may not have enough data — skip gracefully
      }

      // 4. Forecast signals
      try {
        const scenarios = await scenarioService.list(orgId, businessId);
        for (const scenario of scenarios.slice(0, 2)) {
          const forecasts = await scenarioService.getForecast(orgId, businessId);
          if (forecasts?.length) {
            const firstForecast = forecasts[0];
            outputs.push({
              id: randomUUID(),
              orgId,
              businessId,
              type: "forecast" as DecisionEngineOutputType,
              title: `Forecast: ${scenario.objective}`,
              summary: firstForecast ? `Projected revenue: ${firstForecast.projectedRevenue} (growth: ${firstForecast.growthRate})` : "Forecast available",
              priority: "medium",
              expectedImpact: "Forecast-driven early action can prevent deterioration",
              confidence: firstForecast?.confidenceScore ?? 0.6,
              riskScore: 0.4,
              linkedKpis: [],
              linkedObjectiveIds: [],
              linkedRecommendationId: null,
              source: "forecast-engine",
              createdAt: runAt,
              expiresAt: null,
            });
          }
        }
      } catch {
        // Forecast may not be available
      }

      // Sort by priority score
      const priorityOrder: Record<ObjectivePriority, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      outputs.sort((a, b) => (priorityOrder[b.priority] ?? 0) - (priorityOrder[a.priority] ?? 0));

      const topPriority = outputs[0] ?? null;
      const healthSummary = `Decision engine found ${outputs.length} signals: ${criticalKpis.length} KPI risks, ${activeRecs.length} recommendations pending action.`;

      const result: DecisionEngineResult = {
        orgId,
        businessId,
        runAt,
        outputs,
        topPriority,
        riskProfile: riskProfile(outputs),
        healthSummary,
      };

      cache.set(`${orgId}:${businessId}`, result);

      await eventBus.publish(
        createBossEvent(
          "decision.engine.ran",
          { orgId, businessId, outputCount: outputs.length, riskProfile: result.riskProfile, runAt },
          { orgId, businessId, actorId: "decision-engine", requestId: runAt, correlationId: runAt, traceId: runAt },
        ),
      );

      return result;
    },

    async getLatest(orgId, businessId) {
      return cache.get(`${orgId}:${businessId}`) ?? null;
    },
  };
}
