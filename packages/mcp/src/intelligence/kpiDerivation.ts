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
  // Financial signals
  revenue?: number;
  profitMargin?: number;
  outstandingInvoices?: number;
  // Customer signals
  leadResponseTimeMinutes?: number;
  leadConversionRate?: number;
  customerRetentionRate?: number;
  reviewRating?: number;
  measuredAt: string;
}

/**
 * Deterministic KPI derivation from existing platform evidence.
 * Sources platform signals (health score, event counts, financial data,
 * customer metrics) and maps them onto registered KPI keys.
 * No AI inference — pure derivation. Law 1: MCP owns derivation, Loop supplies counts.
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
          // Each completed workflow saves ~2 hrs/week of admin time
          value = Math.max(0, 40 - input.workflowCompletionCount * 2);
          source = "event_log";
          trend = input.workflowCompletionCount > 5 ? "down" : "stable";
        }
        break;

      case "revenue":
        if (input.revenue !== undefined) {
          value = Math.round(input.revenue);
          source = "event_log";
          trend = value > 0 ? "up" : "stable";
        }
        break;

      case "profit_margin":
        if (input.profitMargin !== undefined) {
          value = Math.round(input.profitMargin * 10) / 10;
          source = "event_log";
          trend = value >= 20 ? "up" : value >= 10 ? "stable" : "down";
        }
        break;

      case "outstanding_invoices":
        if (input.outstandingInvoices !== undefined) {
          value = Math.round(input.outstandingInvoices);
          source = "event_log";
          // Lower outstanding invoices is better
          trend = value === 0 ? "up" : input.revenue && value > input.revenue * 0.1 ? "down" : "stable";
        }
        break;

      case "lead_response_time":
        if (input.leadResponseTimeMinutes !== undefined) {
          value = Math.round(input.leadResponseTimeMinutes);
          source = "event_log";
          // Lower response time is better
          trend = value <= 60 ? "up" : value <= 240 ? "stable" : "down";
        }
        break;

      case "lead_conversion_rate":
        if (input.leadConversionRate !== undefined) {
          value = Math.round(input.leadConversionRate * 10) / 10;
          source = "event_log";
          trend = value >= 20 ? "up" : value >= 10 ? "stable" : "down";
        }
        break;

      case "customer_retention":
        if (input.customerRetentionRate !== undefined) {
          value = Math.round(input.customerRetentionRate * 10) / 10;
          source = "event_log";
          trend = value >= 80 ? "up" : value >= 60 ? "stable" : "down";
        }
        break;

      case "review_rating":
        if (input.reviewRating !== undefined) {
          value = Math.round(input.reviewRating * 10) / 10;
          source = "event_log";
          trend = value >= 4.5 ? "up" : value >= 4.0 ? "stable" : "down";
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
