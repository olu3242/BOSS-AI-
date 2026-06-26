import { painPointRegistry } from "@boss/registries";

const painPoints = [
  { key: "missed_leads", label: "Missed Leads", relatedHealthDimensions: ["sales", "marketing"] },
  { key: "slow_follow_up", label: "Slow Follow-Up", relatedHealthDimensions: ["sales", "customer_experience"] },
  { key: "administrative_overload", label: "Administrative Overload", relatedHealthDimensions: ["operations", "team_productivity"] },
  { key: "low_reviews", label: "Low Reviews", relatedHealthDimensions: ["marketing", "customer_experience"] },
  { key: "poor_visibility", label: "Poor Visibility", relatedHealthDimensions: ["financial", "growth"] },
  { key: "scheduling_issues", label: "Scheduling Issues", relatedHealthDimensions: ["operations", "technology"] },
  { key: "outstanding_invoices", label: "Outstanding Invoices", relatedHealthDimensions: ["financial"] },
  { key: "customer_retention", label: "Customer Retention", relatedHealthDimensions: ["customer_experience", "growth"] },
];

export function seedPainPoints(): void {
  for (const painPoint of painPoints) {
    painPointRegistry.register(painPoint);
  }
}
