import { goalOptionRegistry } from "@boss/registries";

const goalOptions = [
  { key: "growth", category: "growth" as const, label: "Growth" },
  { key: "profitability", category: "profitability" as const, label: "Profitability" },
  { key: "customer_experience", category: "customer_experience" as const, label: "Customer Experience" },
  { key: "operations", category: "operations" as const, label: "Operations" },
  { key: "automation", category: "automation" as const, label: "Automation" },
  { key: "staff_productivity", category: "staff_productivity" as const, label: "Staff Productivity" },
];

export function seedGoalOptions(): void {
  for (const goalOption of goalOptions) {
    goalOptionRegistry.register(goalOption);
  }
}
