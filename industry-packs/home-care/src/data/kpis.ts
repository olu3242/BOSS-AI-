import { kpiRegistry } from "@boss/registries";

const kpis = [
  {
    key: "hcare_caregiver_utilization",
    label: "Caregiver Utilization",
    description: "Percentage of available caregiver hours that are scheduled and worked with clients.",
    formulaPlaceholder: "billable_caregiver_hours / available_caregiver_hours",
    owner: "Operations",
    measurementFrequency: "weekly" as const,
    targetRange: "> 75%",
  },
  {
    key: "hcare_client_retention_rate",
    label: "Client Retention Rate",
    description: "Percentage of active clients who continue service month over month.",
    formulaPlaceholder: "clients_retained / clients_at_start_of_period",
    owner: "Operations",
    measurementFrequency: "monthly" as const,
    targetRange: "> 90%",
  },
  {
    key: "hcare_avg_weekly_hours_per_client",
    label: "Average Weekly Care Hours per Client",
    description: "Average number of care hours delivered per active client per week.",
    formulaPlaceholder: "total_care_hours / active_clients",
    owner: "Operations",
    measurementFrequency: "weekly" as const,
    targetRange: "> 20 hours/week",
  },
  {
    key: "hcare_caregiver_turnover_rate",
    label: "Caregiver Turnover Rate",
    description: "Percentage of caregivers who leave the organization within a given period.",
    formulaPlaceholder: "caregivers_departed / avg_caregiver_headcount",
    owner: "People",
    measurementFrequency: "monthly" as const,
    targetRange: "< 40%/year",
  },
  {
    key: "hcare_revenue_per_caregiver_hour",
    label: "Revenue per Caregiver Hour",
    description: "Total revenue generated for each caregiver hour worked.",
    formulaPlaceholder: "total_revenue / total_caregiver_hours_worked",
    owner: "Finance",
    measurementFrequency: "monthly" as const,
    targetRange: "> $22",
  },
  {
    key: "hcare_client_satisfaction_score",
    label: "Client Satisfaction Score",
    description: "Composite satisfaction score from client and family surveys on a 0–10 scale.",
    formulaPlaceholder: "avg(client_survey_score)",
    owner: "Operations",
    measurementFrequency: "monthly" as const,
    targetRange: "> 8.5",
  },
  {
    key: "hcare_missed_visit_rate",
    label: "Missed Visit Rate",
    description: "Percentage of scheduled visits that were missed or significantly late.",
    formulaPlaceholder: "missed_visits / total_scheduled_visits",
    owner: "Operations",
    measurementFrequency: "weekly" as const,
    targetRange: "< 3%",
  },
  {
    key: "hcare_referral_conversion_rate",
    label: "Referral to Client Conversion Rate",
    description: "Percentage of incoming referrals that convert to active paying clients.",
    formulaPlaceholder: "new_clients_from_referrals / total_referrals_received",
    owner: "Marketing",
    measurementFrequency: "monthly" as const,
    targetRange: "> 60%",
  },
  {
    key: "hcare_billable_hours_pct",
    label: "Billable Hours Percentage",
    description: "Billable care hours as a percentage of total scheduled hours, measuring schedule adherence.",
    formulaPlaceholder: "billable_hours / scheduled_hours",
    owner: "Finance",
    measurementFrequency: "weekly" as const,
    targetRange: "> 95%",
  },
  {
    key: "hcare_caregiver_match_score",
    label: "Caregiver-Client Match Satisfaction Score",
    description: "Average satisfaction rating from clients and families on how well caregivers match their needs and preferences.",
    formulaPlaceholder: "avg(match_satisfaction_rating)",
    owner: "Operations",
    measurementFrequency: "monthly" as const,
    targetRange: "> 8.0",
  },
];

export function seedKpis(): void {
  for (const kpi of kpis) {
    kpiRegistry.register(kpi);
  }
}
