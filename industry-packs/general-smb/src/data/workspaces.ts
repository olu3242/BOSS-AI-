import { workspaceRegistry } from "@boss/registries";

export function seedWorkspaces(): void {
  workspaceRegistry.register({
    key: "executive_workspace",
    label: "Executive Workspace",
    description: "High-level view for business owners: health, decisions, KPIs, and loop status.",
    layout: "executive",
    modules: [
      { moduleKey: "health_summary", enabled: true, position: 1, refreshIntervalSeconds: 300, showInMobile: true },
      { moduleKey: "kpi_strip", enabled: true, position: 2, refreshIntervalSeconds: 300, showInMobile: true },
      { moduleKey: "decisions_panel", enabled: true, position: 3, refreshIntervalSeconds: 60, showInMobile: true },
      { moduleKey: "loop_status", enabled: true, position: 4, refreshIntervalSeconds: 60, showInMobile: false },
      { moduleKey: "approval_queue", enabled: true, position: 5, refreshIntervalSeconds: 60, showInMobile: true },
      { moduleKey: "timeline_preview", enabled: true, position: 6, refreshIntervalSeconds: 120, showInMobile: false },
    ],
    defaultRoute: "/workspace",
    primaryMetricKey: "overall_health_score",
    showOperatingLoopStatus: true,
  });

  workspaceRegistry.register({
    key: "operational_workspace",
    label: "Operational Workspace",
    description: "Day-to-day view for operations managers: automation status, tool executions, approvals.",
    layout: "operational",
    modules: [
      { moduleKey: "automation_status", enabled: true, position: 1, refreshIntervalSeconds: 30, showInMobile: true },
      { moduleKey: "approval_queue", enabled: true, position: 2, refreshIntervalSeconds: 30, showInMobile: true },
      { moduleKey: "timeline_preview", enabled: true, position: 3, refreshIntervalSeconds: 60, showInMobile: false },
      { moduleKey: "kpi_strip", enabled: true, position: 4, refreshIntervalSeconds: 300, showInMobile: false },
      { moduleKey: "loop_status", enabled: true, position: 5, refreshIntervalSeconds: 60, showInMobile: false },
    ],
    defaultRoute: "/workspace/automation",
    primaryMetricKey: "workflow_completion_rate",
    showOperatingLoopStatus: true,
  });

  workspaceRegistry.register({
    key: "analytical_workspace",
    label: "Analytical Workspace",
    description: "Deep analysis view: root causes, scenarios, optimization reports, roadmap.",
    layout: "analytical",
    modules: [
      { moduleKey: "intelligence_summary", enabled: true, position: 1, refreshIntervalSeconds: 600, showInMobile: false },
      { moduleKey: "decisions_panel", enabled: true, position: 2, refreshIntervalSeconds: 120, showInMobile: false },
      { moduleKey: "kpi_strip", enabled: true, position: 3, refreshIntervalSeconds: 300, showInMobile: false },
      { moduleKey: "health_summary", enabled: true, position: 4, refreshIntervalSeconds: 300, showInMobile: false },
    ],
    defaultRoute: "/workspace/intelligence",
    primaryMetricKey: "revenue_growth_rate",
    showOperatingLoopStatus: false,
  });
}
