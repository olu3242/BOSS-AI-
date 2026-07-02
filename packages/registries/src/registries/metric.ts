import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type MetricAggregation = "sum" | "avg" | "count" | "latest" | "max" | "min";

export interface MetricEntry extends RegistryEntry {
  description: string;
  unit: string;
  aggregation: MetricAggregation;
  sourceEventTypes: string[];
  kpiKey?: string;
}

export const metricRegistry = createRegistry<MetricEntry>();

// Platform-level metric definitions tied to canonical KPI keys from general-smb pack.
// Industry packs may register additional metrics; these cover all cross-industry signals.
const platformMetrics: MetricEntry[] = [
  {
    key: "metric.business_health_score",
    label: "Business Health Score",
    description: "Composite health score across all dimensions (0–100).",
    unit: "%",
    aggregation: "latest",
    sourceEventTypes: ["business.health.calculated"],
    kpiKey: "business_health_score",
  },
  {
    key: "metric.business_growth_score",
    label: "Business Growth Score",
    description: "Composite growth score derived from revenue and retention signals.",
    unit: "%",
    aggregation: "latest",
    sourceEventTypes: ["business.health.calculated"],
    kpiKey: "business_growth_score",
  },
  {
    key: "metric.ai_adoption_score",
    label: "AI Adoption Score",
    description: "Percentage of available AI capabilities actively in use.",
    unit: "%",
    aggregation: "latest",
    sourceEventTypes: ["tool.executed", "workflow.completed"],
    kpiKey: "ai_adoption_score",
  },
  {
    key: "metric.administrative_hours",
    label: "Administrative Hours",
    description: "Hours per week spent on administrative tasks.",
    unit: "hrs/week",
    aggregation: "avg",
    sourceEventTypes: ["workflow.completed"],
    kpiKey: "administrative_hours",
  },
  {
    key: "metric.revenue",
    label: "Revenue",
    description: "Total revenue recognized in the measurement period.",
    unit: "USD",
    aggregation: "sum",
    sourceEventTypes: ["invoice.paid"],
    kpiKey: "revenue",
  },
  {
    key: "metric.profit_margin",
    label: "Profit Margin",
    description: "Net profit as a percentage of revenue.",
    unit: "%",
    aggregation: "avg",
    sourceEventTypes: ["invoice.paid"],
    kpiKey: "profit_margin",
  },
  {
    key: "metric.outstanding_invoices",
    label: "Outstanding Invoices",
    description: "Total value of unpaid invoices.",
    unit: "USD",
    aggregation: "sum",
    sourceEventTypes: ["invoice.created", "invoice.paid"],
    kpiKey: "outstanding_invoices",
  },
  {
    key: "metric.lead_response_time",
    label: "Lead Response Time",
    description: "Average time from lead creation to first contact attempt.",
    unit: "minutes",
    aggregation: "avg",
    sourceEventTypes: ["lead.created", "lead.contacted"],
    kpiKey: "lead_response_time",
  },
  {
    key: "metric.lead_conversion_rate",
    label: "Lead Conversion Rate",
    description: "Percentage of leads that convert to paying customers.",
    unit: "%",
    aggregation: "avg",
    sourceEventTypes: ["lead.converted"],
    kpiKey: "lead_conversion_rate",
  },
  {
    key: "metric.customer_retention",
    label: "Customer Retention",
    description: "Percentage of customers retained period over period.",
    unit: "%",
    aggregation: "avg",
    sourceEventTypes: ["customer.churned", "customer.renewed"],
    kpiKey: "customer_retention",
  },
  {
    key: "metric.review_rating",
    label: "Review Rating",
    description: "Average customer review rating across all platforms.",
    unit: "stars",
    aggregation: "avg",
    sourceEventTypes: ["review.received"],
    kpiKey: "review_rating",
  },
  {
    key: "metric.workflow_completions",
    label: "Workflow Completions",
    description: "Total number of automated workflows completed in the period.",
    unit: "count",
    aggregation: "count",
    sourceEventTypes: ["workflow.completed"],
  },
  {
    key: "metric.tool_executions",
    label: "Tool Executions",
    description: "Total number of AI tool executions in the period.",
    unit: "count",
    aggregation: "count",
    sourceEventTypes: ["tool.executed"],
  },
];

for (const metric of platformMetrics) {
  metricRegistry.register(metric);
}
