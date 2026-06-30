import { nowIso } from "@boss/shared";
import { deriveKpiReadings, type KpiReading } from "@boss/mcp";
import type { RepositoryContainer } from "../container.js";

export interface KpiMeasurementService {
  /**
   * Derives KPI readings for a business by composing evidence from existing
   * repositories: health score, event log counts, workflow completions.
   * Emits a `business.kpi.measured` domain event so the event pipeline stays intact.
   */
  measure(orgId: string, businessId: string): Promise<{ readings: KpiReading[]; measuredAt: string }>;
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

      await repos.eventBus.publish({
        type: "business.kpi.measured",
        payload: { orgId, businessId, readingCount: readings.length, measuredAt },
        occurredAt: measuredAt,
        orgId,
        correlationId: null,
        causationId: null,
      });

      return { readings, measuredAt };
    },
  };
}
