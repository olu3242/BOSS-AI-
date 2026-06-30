import { kpiRegistry } from "@boss/registries";

export interface KpiReading {
  kpiKey: string;
  label: string;
  value: number | null;
  unit: string;
  measuredAt: string;
  source: "event_log" | "health_score" | "registry_default";
  trend: "up" | "down" | "stable" | "unknown";
}

export interface KpiSnapshotInput {
  overallHealthScore?: number;
  growthScore?: number;
  aiAdoptionScore?: number;
  toolExecutionCount?: number;
  workflowCompletionCount?: number;
  measuredAt: string;
}

/**
 * Deterministic KPI derivation from existing platform evidence.
 * Sources platform signals (health score, event counts, tool executions)
 * and maps them onto registered KPI keys. No AI inference — pure derivation.
 * Law 1 compliant: MCP owns the derivation logic; Loop supplies raw counts.
 */
export function deriveKpiReadings(input: KpiSnapshotInput): KpiReading[] {
  const readings: KpiReading[] = [];
  const allKpis = kpiRegistry.list();

  for (const kpi of allKpis) {
    let value: number | null = null;
    let source: KpiReading["source"] = "registry_default";
    let trend: KpiReading["trend"] = "unknown";

    switch (kpi.key) {
      case "business_health_score":
        if (input.overallHealthScore !== undefined) {
          value = Math.round(input.overallHealthScore);
          source = "health_score";
          trend = value >= 70 ? "up" : value >= 50 ? "stable" : "down";
        }
        break;
      case "business_growth_score":
        if (input.growthScore !== undefined) {
          value = Math.round(input.growthScore);
          source = "health_score";
          trend = value >= 70 ? "up" : "stable";
        }
        break;
      case "ai_adoption_score":
        if (input.aiAdoptionScore !== undefined) {
          value = Math.round(input.aiAdoptionScore);
          source = "health_score";
          trend = value >= 60 ? "up" : "stable";
        } else if (input.toolExecutionCount !== undefined) {
          value = Math.min(100, Math.round((input.toolExecutionCount / 10) * 100));
          source = "event_log";
          trend = input.toolExecutionCount > 0 ? "up" : "stable";
        }
        break;
      case "administrative_hours":
        if (input.workflowCompletionCount !== undefined) {
          value = Math.max(0, 40 - input.workflowCompletionCount * 2);
          source = "event_log";
          trend = input.workflowCompletionCount > 5 ? "down" : "stable";
        }
        break;
      default:
        break;
    }

    readings.push({
      kpiKey: kpi.key,
      label: kpi.label,
      value,
      unit: deriveUnit(kpi.key),
      measuredAt: input.measuredAt,
      source,
      trend,
    });
  }

  return readings;
}

function deriveUnit(kpiKey: string): string {
  if (kpiKey.endsWith("_score") || kpiKey.endsWith("_rate") || kpiKey === "profit_margin") return "%";
  if (kpiKey === "revenue") return "USD";
  if (kpiKey === "outstanding_invoices") return "USD";
  if (kpiKey === "administrative_hours") return "hrs/week";
  if (kpiKey === "lead_response_time") return "minutes";
  if (kpiKey === "review_rating") return "stars";
  return "unit";
}
