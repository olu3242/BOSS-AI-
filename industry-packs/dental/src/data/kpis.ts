import { kpiRegistry } from "@boss/registries";

const kpis = [
  {
    key: "dental_chair_utilization",
    label: "Chair Utilization",
    description: "Percentage of available chair time filled with patient appointments.",
    formulaPlaceholder: "booked_chair_hours / available_chair_hours",
    owner: "Operations",
    measurementFrequency: "weekly" as const,
    targetRange: "> 80%",
  },
  {
    key: "dental_provider_production",
    label: "Provider Production",
    description: "Total dollar value of dentistry produced per provider per period.",
    formulaPlaceholder: "sum(procedure_value where provider = X)",
    owner: "Finance",
    measurementFrequency: "monthly" as const,
    targetRange: "> $50,000/month per provider",
  },
  {
    key: "dental_collections_ratio",
    label: "Collections Ratio",
    description: "Percentage of production that is actually collected (insurance + patient payments).",
    formulaPlaceholder: "total_collected / total_produced",
    owner: "Finance",
    measurementFrequency: "monthly" as const,
    targetRange: "> 95%",
  },
  {
    key: "dental_case_acceptance",
    label: "Case Acceptance Rate",
    description: "Percentage of presented treatment plans that patients accept.",
    formulaPlaceholder: "accepted_treatment_plans / presented_treatment_plans",
    owner: "Sales",
    measurementFrequency: "monthly" as const,
    targetRange: "> 65%",
  },
  {
    key: "dental_recall_completion",
    label: "Recall Completion Rate",
    description: "Percentage of patients due for recall who schedule and complete their appointment.",
    formulaPlaceholder: "completed_recall_visits / due_for_recall",
    owner: "Operations",
    measurementFrequency: "monthly" as const,
    targetRange: "> 75%",
  },
  {
    key: "dental_hygiene_reappointment",
    label: "Hygiene Reappointment Rate",
    description: "Percentage of hygiene patients who rebook before leaving the practice.",
    formulaPlaceholder: "prebooked_recall / total_hygiene_visits",
    owner: "Operations",
    measurementFrequency: "weekly" as const,
    targetRange: "> 85%",
  },
  {
    key: "dental_no_show_rate",
    label: "No-Show Rate",
    description: "Percentage of scheduled appointments that result in a no-show or same-day cancellation.",
    formulaPlaceholder: "no_shows / total_scheduled",
    owner: "Operations",
    measurementFrequency: "weekly" as const,
    targetRange: "< 8%",
  },
  {
    key: "dental_cancellation_rate",
    label: "Cancellation Rate",
    description: "Percentage of appointments cancelled with less than 24 hours notice.",
    formulaPlaceholder: "late_cancellations / total_scheduled",
    owner: "Operations",
    measurementFrequency: "weekly" as const,
    targetRange: "< 5%",
  },
  {
    key: "dental_avg_production_per_visit",
    label: "Average Production per Visit",
    description: "Average dollar value of procedures completed per patient visit.",
    formulaPlaceholder: "total_production / completed_visits",
    owner: "Finance",
    measurementFrequency: "monthly" as const,
    targetRange: "> $350",
  },
  {
    key: "dental_new_patient_growth",
    label: "New Patient Growth",
    description: "Number of new patients seen per month.",
    formulaPlaceholder: "count(patients where first_visit = current_period)",
    owner: "Marketing",
    measurementFrequency: "monthly" as const,
    targetRange: "> 20/month",
  },
];

export function seedKpis(): void {
  for (const kpi of kpis) {
    kpiRegistry.register(kpi);
  }
}
