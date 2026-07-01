import { mriQuestionRegistry } from "@boss/registries";

const questions = [
  {
    key: "retail_ops.total_sqft",
    label: "What is the total retail floor space of your store in square feet?",
    sectionKey: "operations" as const,
    type: "number" as const,
    required: true,
    order: 1,
  },
  {
    key: "retail_ops.num_active_skus",
    label: "Approximately how many active SKUs (unique products) do you currently carry?",
    sectionKey: "operations" as const,
    type: "number" as const,
    required: true,
    order: 2,
  },
  {
    key: "retail_ops.has_loyalty_program",
    label: "Do you have an active customer loyalty or rewards program?",
    sectionKey: "operations" as const,
    type: "boolean" as const,
    required: false,
    order: 3,
  },
  {
    key: "retail_finance.monthly_revenue",
    label: "What is your average monthly retail revenue?",
    sectionKey: "finance" as const,
    type: "number" as const,
    required: true,
    order: 1,
  },
  {
    key: "retail_finance.current_gross_margin_pct",
    label: "What is your approximate current gross margin percentage?",
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
