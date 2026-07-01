import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type WorkspaceModuleKey =
  | "health_summary"
  | "kpi_strip"
  | "decisions_panel"
  | "loop_status"
  | "timeline_preview"
  | "approval_queue"
  | "intelligence_summary"
  | "automation_status";

export type WorkspaceLayout = "executive" | "operational" | "analytical";

export interface WorkspaceModuleConfig {
  moduleKey: WorkspaceModuleKey;
  enabled: boolean;
  position: number;
  refreshIntervalSeconds: number;
  showInMobile: boolean;
}

export interface WorkspaceEntry extends RegistryEntry {
  description: string;
  layout: WorkspaceLayout;
  modules: WorkspaceModuleConfig[];
  defaultRoute: string;
  primaryMetricKey: string;
  showOperatingLoopStatus: boolean;
}

export const workspaceRegistry = createRegistry<WorkspaceEntry>();
