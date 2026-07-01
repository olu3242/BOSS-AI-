import { mriQuestionRegistry } from "@boss/registries";

const questions = [
  {
    key: "cafe_finance.daily_transactions",
    label: "How many transactions do you process per day?",
    sectionKey: "finance" as const,
    type: "number" as const,
    required: true,
    order: 1,
  },
  {
    key: "cafe_ops.has_drive_thru",
    label: "Do you offer drive-thru service?",
    sectionKey: "operations" as const,
    type: "boolean" as const,
    required: true,
    order: 1,
  },
  {
    key: "cafe_ops.busiest_time",
    label: "What is your busiest time of day?",
    sectionKey: "operations" as const,
    type: "single_select" as const,
    required: true,
    order: 2,
    options: ["Early morning (5am–8am)", "Morning (8am–11am)", "Midday (11am–2pm)", "Afternoon (2pm–5pm)", "Evening (5pm+)"],
  },
  {
    key: "cafe_marketing.has_loyalty_program",
    label: "Do you have a loyalty program?",
    sectionKey: "marketing" as const,
    type: "boolean" as const,
    required: true,
    order: 1,
  },
  {
    key: "cafe_technology.inventory_management",
    label: "How do you currently manage inventory?",
    sectionKey: "technology" as const,
    type: "single_select" as const,
    required: false,
    order: 1,
    options: ["Paper/manual counts", "Spreadsheet", "POS built-in inventory", "Dedicated inventory software", "No formal process"],
  },
];

export function seedMri(): void {
  for (const question of questions) {
    mriQuestionRegistry.register(question);
  }
}
