import { mriQuestionRegistry } from "@boss/registries";

const questions = [
  {
    key: "rest_ops.total_seats",
    label: "How many total seats does your restaurant have (indoor + outdoor)?",
    sectionKey: "operations" as const,
    type: "number" as const,
    required: true,
    order: 1,
  },
  {
    key: "rest_ops.services_per_day",
    label: "How many services (lunch, dinner, brunch) do you run on a typical weekday?",
    sectionKey: "operations" as const,
    type: "number" as const,
    required: true,
    order: 2,
  },
  {
    key: "rest_ops.uses_reservation_system",
    label: "Do you use a reservation management system (e.g., OpenTable, Resy, Tock)?",
    sectionKey: "operations" as const,
    type: "boolean" as const,
    required: false,
    order: 3,
  },
  {
    key: "rest_finance.weekly_revenue",
    label: "What is your average weekly food and beverage revenue?",
    sectionKey: "finance" as const,
    type: "number" as const,
    required: true,
    order: 1,
  },
  {
    key: "rest_finance.current_food_cost_pct",
    label: "What is your current food cost percentage (approximate)?",
    sectionKey: "finance" as const,
    type: "number" as const,
    required: true,
    order: 2,
  },
];

export function seedMri(): void {
  for (const question of questions) {
    mriQuestionRegistry.register(question);
  }
}
