import { kpiRegistry } from "@boss/registries";

const kpis = [
  {
    key: "acct_billable_hours_pct",
    label: "Billable Hours %",
    description: "Billable hours as a percentage of total staff hours worked",
    formulaPlaceholder: "(billable_hours / total_hours) * 100",
    owner: "acct_managing_partner",
    measurementFrequency: "weekly" as const,
    targetRange: { min: 65, max: 80, unit: "%" },
  },
  {
    key: "acct_realization_rate",
    label: "Realization Rate",
    description: "Percentage of billed time actually collected from clients",
    formulaPlaceholder: "(collected / billed) * 100",
    owner: "acct_billing_manager",
    measurementFrequency: "monthly" as const,
    targetRange: { min: 88, max: 100, unit: "%" },
  },
  {
    key: "acct_revenue_per_staff",
    label: "Revenue Per Staff Member",
    description: "Total revenue divided by number of billable staff",
    formulaPlaceholder: "total_revenue / billable_staff_count",
    owner: "acct_managing_partner",
    measurementFrequency: "monthly" as const,
    targetRange: { min: 100000, max: 200000, unit: "$" },
  },
  {
    key: "acct_client_retention_rate",
    label: "Client Retention Rate",
    description: "Percentage of clients retained year over year",
    formulaPlaceholder: "(returning_clients / prior_year_clients) * 100",
    owner: "acct_client_manager",
    measurementFrequency: "annually" as const,
    targetRange: { min: 85, max: 95, unit: "%" },
  },
  {
    key: "acct_avg_engagement_value",
    label: "Average Engagement Value",
    description: "Average annual revenue per client engagement",
    formulaPlaceholder: "total_revenue / active_clients",
    owner: "acct_managing_partner",
    measurementFrequency: "monthly" as const,
    targetRange: { min: 5000, max: 25000, unit: "$" },
  },
  {
    key: "acct_accounts_receivable_days",
    label: "AR Days Outstanding",
    description: "Average days outstanding on accounts receivable",
    formulaPlaceholder: "(accounts_receivable / annual_revenue) * 365",
    owner: "acct_billing_manager",
    measurementFrequency: "monthly" as const,
    targetRange: { min: 15, max: 45, unit: "days" },
  },
  {
    key: "acct_new_clients_per_quarter",
    label: "New Clients Per Quarter",
    description: "Number of new client engagements signed per quarter",
    formulaPlaceholder: "count(new_engagements this quarter)",
    owner: "acct_business_developer",
    measurementFrequency: "quarterly" as const,
    targetRange: { min: 3, max: 10, unit: "clients" },
  },
  {
    key: "acct_write_off_rate",
    label: "Write-Off Rate",
    description: "Percentage of billed time written off",
    formulaPlaceholder: "(written_off_hours / billed_hours) * 100",
    owner: "acct_managing_partner",
    measurementFrequency: "monthly" as const,
    targetRange: { min: 0, max: 8, unit: "%" },
  },
  {
    key: "acct_on_time_delivery_rate",
    label: "On-Time Delivery Rate",
    description: "Percentage of client deliverables completed by agreed deadline",
    formulaPlaceholder: "(on_time_deliverables / total_deliverables) * 100",
    owner: "acct_operations_manager",
    measurementFrequency: "monthly" as const,
    targetRange: { min: 95, max: 100, unit: "%" },
  },
  {
    key: "acct_referral_conversion_rate",
    label: "Referral Conversion Rate",
    description: "Percentage of referrals that become paying clients",
    formulaPlaceholder: "(converted_referrals / total_referrals) * 100",
    owner: "acct_business_developer",
    measurementFrequency: "quarterly" as const,
    targetRange: { min: 45, max: 70, unit: "%" },
  },
];

export function seedKpis(): void {
  for (const kpi of kpis) {
    kpiRegistry.register(kpi);
  }
}
