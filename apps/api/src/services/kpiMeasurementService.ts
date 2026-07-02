import { nowIso } from "@boss/shared";
import {
  deriveKpiReadings,
  deriveKpiRecommendations,
  deriveKpiHealthScore,
  type KpiReading,
} from "@boss/mcp";
import type { KpiReadingRecord } from "@boss/types";
import type { RepositoryContainer } from "../container.js";
import type { GeneratedRecommendation } from "@boss/mcp";
import type { KpiHealthScore } from "@boss/mcp";

export interface KpiMeasurementService {
  measure(orgId: string, businessId: string): Promise<{
    readings: KpiReading[];
    persisted: KpiReadingRecord[];
    measuredAt: string;
    kpiHealthScore: KpiHealthScore;
    kpiRecommendations: GeneratedRecommendation[];
  }>;
  history(orgId: string, businessId: string, kpiKey?: string, limit?: number): Promise<KpiReadingRecord[]>;
}

export function createKpiMeasurementService(repos: RepositoryContainer): KpiMeasurementService {
  return {
    async measure(orgId, businessId) {
      const measuredAt = nowIso();

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

      const persisted = await Promise.all(
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

      // Derive KPI-driven health score and recommendations in MCP.
      const kpiHealthScore = deriveKpiHealthScore(readings, measuredAt);
      const kpiRecommendations = deriveKpiRecommendations(
        readings,
        business?.employeeCount ?? 5,
      );

      await repos.eventBus.publish({
        type: "business.kpi.measured",
        payload: {
          orgId,
          businessId,
          readingCount: readings.length,
          kpiHealthScore: kpiHealthScore.overallScore,
          kpiRecommendationCount: kpiRecommendations.length,
          measuredAt,
        },
        occurredAt: measuredAt,
      });

      return { readings, persisted, measuredAt, kpiHealthScore, kpiRecommendations };
    },

    async history(orgId, businessId, kpiKey, limit) {
      if (kpiKey) {
        return repos.kpiReadings.listByKpiKey(orgId, businessId, kpiKey, limit);
      }
      return repos.kpiReadings.listByBusinessId(orgId, businessId, limit);
    },
  };
}
