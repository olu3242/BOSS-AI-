/**
 * KPI Platform — canonical KPI service for BOSS.
 *
 * Architecture law: ALL KPI reads route through this service.
 * No service calls deriveKpiReadings directly — use KpiPlatformService.measure().
 *
 * Provides: historical, current, forecast, trend, status, objectives linkage.
 */
import { createBossEvent, type EventBus } from "@boss/events";
import {
  deriveKpiReadings,
  deriveKpiRecommendations,
  deriveKpiHealthScore,
} from "@boss/mcp";
import type { CanonicalKpi, KpiDataPoint, KpiForecast, KpiTrend, KpiStatus } from "@boss/types";
import type { RepositoryContainer } from "../container.js";

export interface KpiMeasureResult {
  kpis: CanonicalKpi[];
  measuredAt: string;
  healthScore: number;
}

export interface KpiPlatformService {
  /** Measure all KPIs for a business, persist readings, return enriched view. */
  measure(orgId: string, businessId: string): Promise<KpiMeasureResult>;
  /** Get current canonical KPI view (last measurement + history + forecast). */
  get(orgId: string, businessId: string, kpiKey: string): Promise<CanonicalKpi | null>;
  /** List all canonical KPIs for a business. */
  list(orgId: string, businessId: string): Promise<CanonicalKpi[]>;
  /** Get history for a specific KPI. */
  history(orgId: string, businessId: string, kpiKey: string, limit?: number): Promise<KpiDataPoint[]>;
  /** Get forecast for a specific KPI. */
  forecast(orgId: string, businessId: string, kpiKey: string): Promise<KpiForecast[]>;
}

function determineTrend(history: KpiDataPoint[]): KpiTrend {
  if (history.length < 2) return "unknown";
  const recent = history.slice(-5);
  const first = recent[0]?.value ?? 0;
  const last = recent[recent.length - 1]?.value ?? 0;
  const delta = last - first;
  if (Math.abs(delta) < 0.01 * Math.abs(first || 1)) return "stable";
  return delta > 0 ? "improving" : "declining";
}


function buildForecasts(history: KpiDataPoint[]): KpiForecast[] {
  if (history.length < 3) return [];
  const recent = history.slice(-6);
  const last = recent[recent.length - 1]?.value ?? 0;
  const avg = recent.reduce((s, p) => s + p.value, 0) / recent.length;
  const growthRate = avg > 0 ? (last - avg) / avg : 0;

  return [1, 2, 3].map((i) => {
    const predicted = last * (1 + growthRate * i);
    return {
      period: `+${i}mo`,
      predictedValue: Math.round(predicted * 100) / 100,
      confidence: Math.max(0.3, 0.9 - i * 0.15),
      low: Math.round(predicted * 0.8 * 100) / 100,
      high: Math.round(predicted * 1.2 * 100) / 100,
    };
  });
}

export function createKpiPlatformService(repos: RepositoryContainer, eventBus: EventBus): KpiPlatformService {
  return {
    async measure(orgId, businessId) {
      const measuredAt = new Date().toISOString();

      const [health, events, workflows, business] = await Promise.all([
        repos.businessHealth.findByBusinessId(orgId, businessId),
        repos.eventLog.listByOrgId(orgId),
        repos.workflowExecutions.listByBusinessId(orgId, businessId),
        repos.businesses.findById(orgId, businessId),
      ]);

      const toolExecutionCount = events.filter((e) => e.type === "tool.execution.succeeded").length;
      const workflowCompletionCount = workflows.filter((w) => w.state === "completed").length;

      const readings = deriveKpiReadings({
        overallHealthScore: health?.overallScore,
        toolExecutionCount,
        workflowCompletionCount,
        measuredAt,
      });

      await Promise.all(
        readings.map((r) =>
          repos.kpiReadings.append({
            orgId,
            businessId,
            kpiKey: r.kpiKey,
            label: r.label,
            value: r.value,
            unit: r.unit,
            trend: r.trend,
            source: r.source,
            measuredAt: r.measuredAt,
          })
        )
      );

      const kpiHealthScore = deriveKpiHealthScore(readings, measuredAt);
      const kpiRecommendations = deriveKpiRecommendations(readings, business?.employeeCount ?? 5);

      // Emit threshold alerts
      const CRITICAL_THRESHOLD = 30;
      for (const reading of readings) {
        if (typeof reading.value === "number" && reading.value < CRITICAL_THRESHOLD) {
          await eventBus.publish(
            createBossEvent(
              "kpi.threshold.exceeded",
              { orgId, businessId, kpiKey: reading.kpiKey, label: reading.label, value: reading.value, threshold: CRITICAL_THRESHOLD, measuredAt },
              { orgId, businessId, actorId: "kpi-platform", requestId: measuredAt, correlationId: measuredAt, traceId: measuredAt },
            ),
          );
        }
      }

      await eventBus.publish(
        createBossEvent(
          "business.kpi.measured",
          { orgId, businessId, readingCount: readings.length, kpiHealthScore: kpiHealthScore.overallScore, kpiRecommendationCount: kpiRecommendations.length, measuredAt },
          { orgId, businessId, actorId: "kpi-platform", requestId: measuredAt, correlationId: measuredAt, traceId: measuredAt },
        ),
      );

      const kpis = await this.list(orgId, businessId);
      return { kpis, measuredAt, healthScore: kpiHealthScore.overallScore };
    },

    async get(orgId, businessId, kpiKey) {
      const history = await repos.kpiReadings.listByKpiKey(orgId, businessId, kpiKey, 90);
      if (history.length === 0) return null;

      const dataPoints: KpiDataPoint[] = history.map((r) => ({ value: r.value as number, measuredAt: r.measuredAt }));
      const latest = history[history.length - 1];

      return {
        orgId,
        businessId,
        kpiKey,
        label: latest?.label ?? kpiKey,
        unit: (latest?.unit as string) ?? "",
        owner: null,
        source: (latest?.source as string) ?? "kpi-platform",
        currentValue: latest?.value as number ?? null,
        previousValue: history.length > 1 ? (history[history.length - 2]?.value as number ?? null) : null,
        targetValue: null,
        trend: determineTrend(dataPoints),
        status: "unknown" as KpiStatus,
        confidence: 0.7,
        history: dataPoints,
        forecasts: buildForecasts(dataPoints),
        linkedObjectiveIds: [],
        measuredAt: latest?.measuredAt ?? null,
      };
    },

    async list(orgId, businessId) {
      const all = await repos.kpiReadings.listByBusinessId(orgId, businessId);
      const byKey = new Map<string, typeof all>();
      for (const r of all) {
        const key = r.kpiKey as string;
        if (!byKey.has(key)) byKey.set(key, []);
        byKey.get(key)!.push(r);
      }

      const kpis: CanonicalKpi[] = [];
      for (const [kpiKey, records] of byKey) {
        const sorted = records.sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));
        const dataPoints: KpiDataPoint[] = sorted.map((r) => ({ value: r.value as number, measuredAt: r.measuredAt }));
        const latest = sorted[sorted.length - 1];
        kpis.push({
          orgId,
          businessId,
          kpiKey,
          label: latest?.label ?? kpiKey,
          unit: (latest?.unit as string) ?? "",
          owner: null,
          source: (latest?.source as string) ?? "kpi-platform",
          currentValue: latest?.value as number ?? null,
          previousValue: sorted.length > 1 ? (sorted[sorted.length - 2]?.value as number ?? null) : null,
          targetValue: null,
          trend: determineTrend(dataPoints),
          status: "unknown" as KpiStatus,
          confidence: 0.7,
          history: dataPoints,
          forecasts: buildForecasts(dataPoints),
          linkedObjectiveIds: [],
          measuredAt: latest?.measuredAt ?? null,
        });
      }
      return kpis;
    },

    async history(orgId, businessId, kpiKey, limit = 90) {
      const records = await repos.kpiReadings.listByKpiKey(orgId, businessId, kpiKey, limit);
      return records.map((r) => ({ value: r.value as number, measuredAt: r.measuredAt }));
    },

    async forecast(orgId, businessId, kpiKey) {
      const history = await this.history(orgId, businessId, kpiKey, 12);
      return buildForecasts(history);
    },
  };
}
