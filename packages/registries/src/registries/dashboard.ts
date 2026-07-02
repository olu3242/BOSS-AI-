import type { RegistryEntry } from "../types.js";
import { createReadonlyRegistry } from "../createReadonlyRegistry.js";

export interface DashboardEntry extends RegistryEntry {
  readonly id: string;
  readonly displayName: string;
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly route: string;
  readonly featureIds: readonly string[];
  readonly dataSourceIds: readonly string[];
  readonly owner: string;
  readonly version: string;
  readonly status: "internal_alpha" | "available" | "deprecated";
  readonly documentation: string;
}

export const dashboardRegistry = createReadonlyRegistry<DashboardEntry>();

dashboardRegistry.register({
  id: "dashboard.command_center",
  key: "command_center",
  displayName: "Command Center",
  label: "Command Center",
  description: "Executive overview: health score, today's priorities, KPI trends, alerts, and AI agent status.",
  route: "/dashboard",
  featureIds: ["business_health", "kpi_trends", "today_priorities", "alerts", "ai_agent_status"],
  dataSourceIds: ["business_health_score", "kpi_readings", "business_timeline", "business_alerts"],
  owner: "platform",
  version: "1.0.0",
  status: "available",
  documentation: "docs/dashboards/command-center.md",
});

dashboardRegistry.register({
  id: "dashboard.business_mri",
  key: "business_mri",
  displayName: "Business MRI",
  label: "Business MRI",
  description: "Deep diagnostic: DNA analysis, capability map, active constraints, and constraint priorities.",
  route: "/onboarding/mri",
  featureIds: ["business_dna", "capability_map", "constraint_analysis", "constraint_priorities"],
  dataSourceIds: ["business_dna", "business_capabilities", "business_constraints"],
  owner: "platform",
  version: "1.0.0",
  status: "available",
  documentation: "docs/dashboards/business-mri.md",
});

dashboardRegistry.register({
  id: "dashboard.recommendations",
  key: "recommendations",
  displayName: "Recommendations",
  label: "AI Recommendations",
  description: "Ranked AI-generated recommendations with evidence, ROI estimates, and transformation roadmap.",
  route: "/recommendations",
  featureIds: ["recommendation_list", "recommendation_priorities", "transformation_roadmap", "evidence_chain"],
  dataSourceIds: ["business_recommendations", "recommendation_priorities", "transformation_roadmap"],
  owner: "platform",
  version: "1.0.0",
  status: "available",
  documentation: "docs/dashboards/recommendations.md",
});

dashboardRegistry.register({
  id: "dashboard.kpi_analytics",
  key: "kpi_analytics",
  displayName: "KPI Analytics",
  label: "KPI Analytics",
  description: "Historical KPI readings, trend analysis, and composite health score breakdown.",
  route: "/analytics/kpis",
  featureIds: ["kpi_history", "kpi_trends", "health_score_breakdown"],
  dataSourceIds: ["kpi_readings", "kpi_health_score"],
  owner: "platform",
  version: "1.0.0",
  status: "internal_alpha",
  documentation: "docs/dashboards/kpi-analytics.md",
});

dashboardRegistry.register({
  id: "dashboard.decision_timeline",
  key: "decision_timeline",
  displayName: "Decision Timeline",
  label: "Decision Timeline",
  description: "Chronological audit log of all business decisions: recommendations issued, approved, and dismissed.",
  route: "/timeline",
  featureIds: ["timeline_feed", "recommendation_history", "decision_audit"],
  dataSourceIds: ["business_timeline"],
  owner: "platform",
  version: "1.0.0",
  status: "internal_alpha",
  documentation: "docs/dashboards/decision-timeline.md",
});
