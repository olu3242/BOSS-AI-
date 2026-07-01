import { workspaceRegistry } from "@boss/registries";
import type { WorkspaceEntry } from "@boss/registries";

const workspace: WorkspaceEntry = {
  key: "hs_executive_workspace",
  label: "Home Services Executive Workspace",
  description: "Field service operations view: jobs, dispatch, revenue, and technician performance.",
  layout: "operational",
  modules: [
    { moduleKey: "health_summary", enabled: true, position: 1, refreshIntervalSeconds: 300, showInMobile: true },
    { moduleKey: "kpi_strip", enabled: true, position: 2, refreshIntervalSeconds: 300, showInMobile: true },
    { moduleKey: "decisions_panel", enabled: true, position: 3, refreshIntervalSeconds: 600, showInMobile: false },
    { moduleKey: "approval_queue", enabled: true, position: 4, refreshIntervalSeconds: 60, showInMobile: true },
    { moduleKey: "loop_status", enabled: true, position: 5, refreshIntervalSeconds: 60, showInMobile: false },
    { moduleKey: "timeline_preview", enabled: true, position: 6, refreshIntervalSeconds: 300, showInMobile: false },
    { moduleKey: "automation_status", enabled: true, position: 7, refreshIntervalSeconds: 300, showInMobile: false },
    { moduleKey: "intelligence_summary", enabled: true, position: 8, refreshIntervalSeconds: 600, showInMobile: false },
  ],
  defaultRoute: "/workspace",
  primaryMetricKey: "hs_technician_utilization",
  showOperatingLoopStatus: true,
};

export function seedWorkspace(): void {
  workspaceRegistry.register(workspace);
}
