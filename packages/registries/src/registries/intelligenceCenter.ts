import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type IntelligencePanelType =
  | "root_cause_summary"
  | "optimization_report"
  | "scenario_comparison"
  | "recommendation_roadmap"
  | "kpi_trend"
  | "decision_pipeline";

export type IntelligenceRefreshPolicy = "on_demand" | "hourly" | "daily";

export interface IntelligencePanelConfig {
  panelType: IntelligencePanelType;
  enabled: boolean;
  position: number;
  maxItemsToShow: number;
  refreshPolicy: IntelligenceRefreshPolicy;
}

export interface IntelligenceEntry extends RegistryEntry {
  description: string;
  summaryPanels: IntelligencePanelConfig[];
  primaryInsightPanel: IntelligencePanelType;
  showConfidenceScores: boolean;
  linkToDecisionPipeline: boolean;
}

export const intelligenceCenterRegistry = createRegistry<IntelligenceEntry>();
