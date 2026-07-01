import { mriQuestionRegistry } from "@boss/registries";

const questions = [
  {
    key: "lscape_ops.crews_count",
    label: "How many crews do you operate?",
    sectionKey: "operations" as const,
    type: "number" as const,
    required: true,
    order: 1,
  },
  {
    key: "lscape_ops.services_offered",
    label: "What services do you offer?",
    sectionKey: "operations" as const,
    type: "multi_select" as const,
    required: true,
    order: 2,
  },
  {
    key: "lscape_finance.avg_job_value",
    label: "What is your average job value in dollars?",
    sectionKey: "finance" as const,
    type: "number" as const,
    required: true,
    order: 1,
  },
  {
    key: "lscape_technology.job_tracking_method",
    label: "How do you currently track jobs?",
    sectionKey: "technology" as const,
    type: "single_select" as const,
    required: true,
    order: 1,
  },
  {
    key: "lscape_ops.peak_season",
    label: "What is your peak season?",
    sectionKey: "operations" as const,
    type: "single_select" as const,
    required: true,
    order: 3,
  },
];

export function seedMri(): void {
  for (const question of questions) {
    mriQuestionRegistry.register(question);
  }
}
