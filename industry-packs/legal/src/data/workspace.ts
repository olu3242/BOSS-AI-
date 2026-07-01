import { workspaceRegistry } from "@boss/registries";

export function seedWorkspace(): void {
  workspaceRegistry.register({
    key: "legal_law_firm_workspace",
    label: "Law Firm Operations",
    description: "Matter lifecycle management, billing performance, and business development for small law firms",
    layout: "operational",
    modules: [
      { moduleKey: "health_summary", enabled: true, position: 1, refreshIntervalSeconds: 300, showInMobile: true },
      { moduleKey: "kpi_strip", enabled: true, position: 2, refreshIntervalSeconds: 300, showInMobile: true },
      { moduleKey: "decisions_panel", enabled: true, position: 3, refreshIntervalSeconds: 600, showInMobile: false },
      { moduleKey: "approval_queue", enabled: true, position: 4, refreshIntervalSeconds: 60, showInMobile: true },
      { moduleKey: "loop_status", enabled: true, position: 5, refreshIntervalSeconds: 60, showInMobile: false },
      { moduleKey: "automation_status", enabled: true, position: 6, refreshIntervalSeconds: 120, showInMobile: false },
      { moduleKey: "timeline_preview", enabled: true, position: 7, refreshIntervalSeconds: 600, showInMobile: false },
      { moduleKey: "intelligence_summary", enabled: true, position: 8, refreshIntervalSeconds: 900, showInMobile: false },
    ],
    defaultRoute: "/dashboard",
    primaryMetricKey: "legal_billable_hours_pct",
    showOperatingLoopStatus: true,
  });
}
