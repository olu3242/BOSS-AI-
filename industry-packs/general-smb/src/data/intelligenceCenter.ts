import { intelligenceCenterRegistry } from "@boss/registries";

export function seedIntelligenceCenter(): void {
  intelligenceCenterRegistry.register({
    key: "smb_intelligence_default",
    label: "SMB Intelligence Center",
    description: "Default intelligence center configuration for small and medium businesses.",
    primaryInsightPanel: "root_cause_summary",
    showConfidenceScores: true,
    linkToDecisionPipeline: true,
    summaryPanels: [
      {
        panelType: "root_cause_summary",
        enabled: true,
        position: 1,
        maxItemsToShow: 5,
        refreshPolicy: "daily",
      },
      {
        panelType: "optimization_report",
        enabled: true,
        position: 2,
        maxItemsToShow: 7,
        refreshPolicy: "daily",
      },
      {
        panelType: "recommendation_roadmap",
        enabled: true,
        position: 3,
        maxItemsToShow: 10,
        refreshPolicy: "daily",
      },
      {
        panelType: "scenario_comparison",
        enabled: true,
        position: 4,
        maxItemsToShow: 3,
        refreshPolicy: "on_demand",
      },
      {
        panelType: "kpi_trend",
        enabled: true,
        position: 5,
        maxItemsToShow: 8,
        refreshPolicy: "hourly",
      },
      {
        panelType: "decision_pipeline",
        enabled: true,
        position: 6,
        maxItemsToShow: 5,
        refreshPolicy: "hourly",
      },
    ],
  });

  intelligenceCenterRegistry.register({
    key: "smb_intelligence_compact",
    label: "SMB Intelligence — Compact View",
    description: "Compact intelligence view for mobile and sidebar display with only the top 3 panels.",
    primaryInsightPanel: "optimization_report",
    showConfidenceScores: false,
    linkToDecisionPipeline: true,
    summaryPanels: [
      {
        panelType: "optimization_report",
        enabled: true,
        position: 1,
        maxItemsToShow: 3,
        refreshPolicy: "daily",
      },
      {
        panelType: "root_cause_summary",
        enabled: true,
        position: 2,
        maxItemsToShow: 3,
        refreshPolicy: "daily",
      },
      {
        panelType: "kpi_trend",
        enabled: true,
        position: 3,
        maxItemsToShow: 4,
        refreshPolicy: "hourly",
      },
    ],
  });
}
