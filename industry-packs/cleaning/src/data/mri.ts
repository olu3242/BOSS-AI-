import { mriQuestionRegistry } from "@boss/registries";

const questions = [
  {
    key: "clean_people.cleaners_employed",
    label: "How many cleaners do you employ (full-time and part-time)?",
    sectionKey: "operations" as const,
    type: "number" as const,
    required: true,
    order: 1,
  },
  {
    key: "clean_ops.services_offered",
    label: "What cleaning services do you offer?",
    sectionKey: "operations" as const,
    type: "multi_select" as const,
    required: true,
    order: 1,
    options: [
      "residential_cleaning",
      "commercial_cleaning",
      "carpet_cleaning",
      "window_washing",
      "pressure_washing",
      "move_in_out_cleaning",
      "deep_cleaning",
      "post_construction",
    ],
  },
  {
    key: "clean_finance.recurring_client_pct",
    label: "What percentage of your clients are on a recurring schedule (weekly, bi-weekly, monthly)?",
    sectionKey: "finance" as const,
    type: "number" as const,
    required: true,
    order: 1,
  },
  {
    key: "clean_tech.scheduling_method",
    label: "How do you currently schedule jobs?",
    sectionKey: "technology" as const,
    type: "single_select" as const,
    required: true,
    order: 1,
    options: ["paper_and_phone", "spreadsheet", "generic_calendar", "field_service_software", "cleaning_specific_software"],
  },
  {
    key: "clean_ops.client_type",
    label: "Do you primarily serve commercial or residential clients?",
    sectionKey: "operations" as const,
    type: "single_select" as const,
    required: true,
    order: 2,
    options: ["residential_only", "commercial_only", "both_residential_and_commercial"],
  },
];

export function seedMri(): void {
  for (const question of questions) {
    mriQuestionRegistry.register(question);
  }
}
