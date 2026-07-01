import { mriQuestionRegistry } from "@boss/registries";

const questions = [
  {
    key: "dental_ops.chairs_available",
    label: "How many dental chairs does your practice have available for patient care?",
    sectionKey: "operations" as const,
    type: "number" as const,
    required: true,
    order: 1,
  },
  {
    key: "dental_ops.providers_count",
    label: "How many producing dentists and hygienists are on your team?",
    sectionKey: "operations" as const,
    type: "number" as const,
    required: true,
    order: 2,
  },
  {
    key: "dental_ops.monthly_new_patients",
    label: "How many new patients does your practice see on average per month?",
    sectionKey: "operations" as const,
    type: "number" as const,
    required: true,
    order: 3,
  },
  {
    key: "dental_finance.monthly_production",
    label: "What is your average monthly production (before adjustments) in dollars?",
    sectionKey: "finance" as const,
    type: "number" as const,
    required: true,
    order: 1,
  },
  {
    key: "dental_finance.has_patient_financing",
    label: "Do you offer patient financing options (e.g., CareCredit, in-house payment plans)?",
    sectionKey: "finance" as const,
    type: "boolean" as const,
    required: false,
    order: 2,
  },
];

export function seedMri(): void {
  for (const question of questions) {
    mriQuestionRegistry.register(question);
  }
}
