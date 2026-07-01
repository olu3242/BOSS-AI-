import { mriQuestionRegistry } from "@boss/registries";

const questions = [
  {
    key: "legal_ops.practice_areas",
    label: "What practice areas does your firm focus on?",
    sectionKey: "operations" as const,
    type: "multi_select" as const,
    required: true,
    order: 1,
  },
  {
    key: "legal_ops.attorney_count",
    label: "How many attorneys (including partners) does your firm have?",
    sectionKey: "identity" as const,
    type: "number" as const,
    required: true,
    order: 2,
  },
  {
    key: "legal_finance.avg_hourly_rate",
    label: "What is your average billing rate per hour?",
    sectionKey: "finance" as const,
    type: "number" as const,
    required: true,
    order: 3,
  },
  {
    key: "legal_ops.billing_system",
    label: "How do you currently track time and billing?",
    sectionKey: "technology" as const,
    type: "single_select" as const,
    required: true,
    order: 4,
  },
  {
    key: "legal_finance.primary_revenue_source",
    label: "What is your primary revenue model?",
    sectionKey: "finance" as const,
    type: "single_select" as const,
    required: true,
    order: 5,
  },
];

export function seedMri(): void {
  for (const question of questions) {
    mriQuestionRegistry.register(question);
  }
}
