import { mriQuestionRegistry } from "@boss/registries";

const questions = [
  {
    key: "hs_ops.avg_jobs_per_day",
    label: "Average Jobs per Day",
    sectionKey: "operations" as const,
    type: "number" as const,
    required: false,
    order: 20,
  },
  {
    key: "hs_ops.technician_count",
    label: "Number of Field Technicians",
    sectionKey: "operations" as const,
    type: "number" as const,
    required: false,
    order: 21,
  },
  {
    key: "hs_ops.callback_rate_pct",
    label: "Estimated Callback Rate (%)",
    sectionKey: "operations" as const,
    type: "number" as const,
    required: false,
    order: 22,
  },
  {
    key: "hs_customers.has_maintenance_plan",
    label: "Offers Maintenance Plans",
    sectionKey: "customers" as const,
    type: "boolean" as const,
    required: false,
    order: 20,
  },
  {
    key: "hs_finance.avg_ticket_value",
    label: "Average Invoice Value ($)",
    sectionKey: "finance" as const,
    type: "number" as const,
    required: false,
    order: 20,
  },
];

export function seedMri(): void {
  for (const question of questions) {
    mriQuestionRegistry.register(question);
  }
}
