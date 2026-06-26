import { healthDimensionRegistry } from "@boss/registries";

const dimensions = [
  { key: "sales", dimensionKey: "sales" as const, label: "Sales Health", description: "Pipeline strength and conversion effectiveness.", weight: 0.15 },
  { key: "marketing", dimensionKey: "marketing" as const, label: "Marketing Health", description: "Visibility, demand generation, and reputation.", weight: 0.1 },
  { key: "operations", dimensionKey: "operations" as const, label: "Operations Health", description: "Process consistency and delivery reliability.", weight: 0.15 },
  { key: "financial", dimensionKey: "financial" as const, label: "Financial Health", description: "Cash flow visibility and collections discipline.", weight: 0.15 },
  { key: "customer_experience", dimensionKey: "customer_experience" as const, label: "Customer Experience", description: "Retention, reviews, and communication quality.", weight: 0.1 },
  { key: "team_productivity", dimensionKey: "team_productivity" as const, label: "Team Productivity", description: "Clarity of responsibilities and task throughput.", weight: 0.1 },
  { key: "technology", dimensionKey: "technology" as const, label: "Technology Health", description: "Tooling coverage across CRM, accounting, scheduling.", weight: 0.1 },
  { key: "growth", dimensionKey: "growth" as const, label: "Growth Health", description: "Trajectory toward stated growth goals.", weight: 0.1 },
  { key: "ai_readiness", dimensionKey: "ai_readiness" as const, label: "AI Readiness", description: "Existing automation and AI tool adoption.", weight: 0.05 },
  { key: "overall", dimensionKey: "overall" as const, label: "Overall Business Health", description: "Weighted composite of all dimensions.", weight: 0 },
];

export function seedHealthDimensions(): void {
  for (const dimension of dimensions) {
    healthDimensionRegistry.register(dimension);
  }
}
