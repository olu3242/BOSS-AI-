import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type InsightCategory =
  | "performance"
  | "risk"
  | "opportunity"
  | "health"
  | "growth"
  | "efficiency";

export type InsightSeverity = "info" | "warning" | "critical";

export interface InsightEntry extends RegistryEntry {
  description: string;
  category: InsightCategory;
  severity: InsightSeverity;
  relatedKpiKeys: string[];
  actionable: boolean;
  recommendationDefinitionKey?: string;
}

export const insightRegistry = createRegistry<InsightEntry>();

// Platform-level insight definitions. Cover cross-industry signals that apply
// to any SMB regardless of vertical. Industry packs may extend with domain insights.
const platformInsights: InsightEntry[] = [
  {
    key: "insight.health_score_declining",
    label: "Business Health Score Declining",
    description: "Overall business health score has dropped below 70 and is trending downward.",
    category: "health",
    severity: "warning",
    relatedKpiKeys: ["business_health_score"],
    actionable: true,
    recommendationDefinitionKey: "rec.run_business_mri",
  },
  {
    key: "insight.health_score_critical",
    label: "Business Health Score Critical",
    description: "Overall business health score has dropped below 50, requiring immediate action.",
    category: "health",
    severity: "critical",
    relatedKpiKeys: ["business_health_score"],
    actionable: true,
    recommendationDefinitionKey: "rec.run_business_mri",
  },
  {
    key: "insight.low_ai_adoption",
    label: "Low AI Adoption",
    description: "AI adoption score is below 40%, leaving significant automation value on the table.",
    category: "efficiency",
    severity: "warning",
    relatedKpiKeys: ["ai_adoption_score"],
    actionable: true,
  },
  {
    key: "insight.admin_hours_high",
    label: "High Administrative Hours",
    description: "Administrative hours exceed 20 hrs/week, indicating manual work that could be automated.",
    category: "efficiency",
    severity: "warning",
    relatedKpiKeys: ["administrative_hours"],
    actionable: true,
  },
  {
    key: "insight.revenue_flat",
    label: "Revenue Growth Stalled",
    description: "Revenue has not grown for two or more consecutive periods.",
    category: "growth",
    severity: "warning",
    relatedKpiKeys: ["revenue", "business_growth_score"],
    actionable: true,
  },
  {
    key: "insight.low_profit_margin",
    label: "Low Profit Margin",
    description: "Net profit margin is below 10%, creating financial fragility.",
    category: "risk",
    severity: "warning",
    relatedKpiKeys: ["profit_margin"],
    actionable: true,
  },
  {
    key: "insight.outstanding_invoices_high",
    label: "High Outstanding Invoices",
    description: "Unpaid invoices exceed 10% of monthly revenue, affecting cash flow.",
    category: "risk",
    severity: "warning",
    relatedKpiKeys: ["outstanding_invoices", "revenue"],
    actionable: true,
  },
  {
    key: "insight.slow_lead_response",
    label: "Slow Lead Response Time",
    description: "Average lead response time exceeds 1 hour, reducing conversion likelihood.",
    category: "performance",
    severity: "warning",
    relatedKpiKeys: ["lead_response_time", "lead_conversion_rate"],
    actionable: true,
  },
  {
    key: "insight.low_retention",
    label: "Low Customer Retention",
    description: "Customer retention rate is below 70%, signaling churn risk.",
    category: "risk",
    severity: "critical",
    relatedKpiKeys: ["customer_retention"],
    actionable: true,
  },
  {
    key: "insight.low_review_rating",
    label: "Low Review Rating",
    description: "Average review rating is below 4.0, which harms organic customer acquisition.",
    category: "performance",
    severity: "warning",
    relatedKpiKeys: ["review_rating"],
    actionable: true,
  },
  {
    key: "insight.growth_opportunity",
    label: "Growth Opportunity Detected",
    description: "Business health and retention metrics are strong — conditions favor growth investment.",
    category: "opportunity",
    severity: "info",
    relatedKpiKeys: ["business_growth_score", "customer_retention", "revenue"],
    actionable: true,
  },
  {
    key: "insight.workflow_automation_opportunity",
    label: "Workflow Automation Opportunity",
    description: "High admin hours combined with available AI tools indicate automation ROI potential.",
    category: "opportunity",
    severity: "info",
    relatedKpiKeys: ["administrative_hours", "ai_adoption_score"],
    actionable: true,
  },
];

for (const insight of platformInsights) {
  insightRegistry.register(insight);
}
