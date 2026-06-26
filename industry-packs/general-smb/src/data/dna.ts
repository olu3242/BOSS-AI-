import { dnaDimensionRegistry } from "@boss/registries";

const dimensions = [
  { key: "archetype", dimensionKey: "archetype" as const, label: "Business Archetype", possibleValues: ["solo_operator", "owner_operator", "growth_stage_team", "established_enterprise"] },
  { key: "growthStage", dimensionKey: "growthStage" as const, label: "Growth Stage", possibleValues: ["startup", "early_growth", "scaling", "mature"] },
  { key: "operationalComplexity", dimensionKey: "operationalComplexity" as const, label: "Operational Complexity", possibleValues: ["simple", "moderate", "complex", "highly_complex"] },
  { key: "technologyMaturity", dimensionKey: "technologyMaturity" as const, label: "Technology Maturity", possibleValues: ["manual", "basic_tools", "integrated", "advanced"] },
  { key: "automationReadiness", dimensionKey: "automationReadiness" as const, label: "Automation Readiness", possibleValues: ["low", "moderate", "high", "very_high"] },
  { key: "customerEngagementStyle", dimensionKey: "customerEngagementStyle" as const, label: "Customer Engagement Style", possibleValues: ["transactional", "relationship_driven", "community_driven", "self_service"] },
  { key: "revenueModel", dimensionKey: "revenueModel" as const, label: "Revenue Model", possibleValues: ["one_time_sales", "recurring_subscription", "service_based", "mixed"] },
  { key: "communicationStyle", dimensionKey: "communicationStyle" as const, label: "Communication Style", possibleValues: ["formal", "casual", "high_touch", "low_touch"] },
  { key: "decisionStyle", dimensionKey: "decisionStyle" as const, label: "Decision Style", possibleValues: ["data_driven", "intuitive", "consensus_driven", "owner_led"] },
  { key: "riskProfile", dimensionKey: "riskProfile" as const, label: "Risk Profile", possibleValues: ["risk_averse", "balanced", "risk_tolerant"] },
];

export function seedDnaDimensions(): void {
  for (const dimension of dimensions) {
    dnaDimensionRegistry.register(dimension);
  }
}
