import { nowIso } from "@boss/shared";
import { deriveKpiReadings, type KpiReading } from "@boss/mcp";
import type { KpiReadingRecord } from "@boss/types";
import type { RepositoryContainer } from "../container.js";

export interface KpiMeasurementService {
  measure(orgId: string, businessId: string): Promise<{ readings: KpiReading[]; persisted: KpiReadingRecord[]; measuredAt: string }>;
  history(orgId: string, businessId: string, kpiKey?: string, limit?: number): Promise<KpiReadingRecord[]>;
}

export function createKpiMeasurementService(repos: RepositoryContainer): KpiMeasurementService {
  return {
    async measure(orgId, businessId) {
      const measuredAt = nowIso();

      const [health, events, workflows] = await Promise.all([
        repos.businessHealth.findByBusinessId(orgId, businessId),
        repos.eventLog.listByOrgId(orgId),
        repos.workflowExecutions.listByBusinessId(orgId, businessId),
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

      await repos.eventBus.publish({
        type: "business.kpi.measured",
        payload: { orgId, businessId, readingCount: readings.length, measuredAt },
        occurredAt: measuredAt,
      });

      return { readings, persisted, measuredAt };
    },

    async history(orgId, businessId, kpiKey, limit) {
      if (kpiKey) {
        return repos.kpiReadings.listByKpiKey(orgId, businessId, kpiKey, limit);
      }
      return repos.kpiReadings.listByBusinessId(orgId, businessId, limit);
    },
  };
}
