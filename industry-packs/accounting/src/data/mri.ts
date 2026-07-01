import { mriQuestionRegistry } from "@boss/registries";

const questions = [
  {
    key: "acct_ops.services_offered",
    label: "What accounting services does your firm provide?",
    sectionKey: "operations" as const,
    type: "multi_select" as const,
    required: true,
    order: 1,
  },
  {
    key: "acct_ops.staff_count",
    label: "How many billable staff does your firm have?",
    sectionKey: "identity" as const,
    type: "number" as const,
    required: true,
    order: 2,
  },
  {
    key: "acct_finance.avg_client_fee",
    label: "What is your average annual fee per client?",
    sectionKey: "finance" as const,
    type: "number" as const,
    required: true,
    order: 3,
  },
  {
    key: "acct_ops.practice_software",
    label: "What practice management software do you currently use?",
    sectionKey: "technology" as const,
    type: "single_select" as const,
    required: true,
    order: 4,
  },
  {
    key: "acct_ops.peak_season",
    label: "When is your firm's busiest season?",
    sectionKey: "operations" as const,
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
