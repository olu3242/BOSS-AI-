import { kpiRegistry } from "@boss/registries";

const kpis = [
  {
    key: "legal_billable_hours_pct",
    label: "Billable Hours %",
    description: "Billable hours as a percentage of total attorney hours worked",
    formulaPlaceholder: "(billable_hours / total_hours) * 100",
    owner: "legal_managing_partner",
    measurementFrequency: "weekly" as const,
    targetRange: { min: 70, max: 85, unit: "%" },
  },
  {
    key: "legal_realization_rate",
    label: "Realization Rate",
    description: "Percentage of billed hours actually collected from clients",
    formulaPlaceholder: "(collected / billed) * 100",
    owner: "legal_billing_manager",
    measurementFrequency: "monthly" as const,
    targetRange: { min: 85, max: 100, unit: "%" },
  },
  {
    key: "legal_avg_hourly_rate",
    label: "Average Hourly Rate",
    description: "Average effective billing rate across all attorneys",
    formulaPlaceholder: "total_revenue / total_billable_hours",
    owner: "legal_managing_partner",
    measurementFrequency: "monthly" as const,
    targetRange: { min: 200, max: 500, unit: "$/hr" },
  },
  {
    key: "legal_matter_cycle_time",
    label: "Matter Cycle Time",
    description: "Average days from matter open to close",
    formulaPlaceholder: "avg(matter_close_date - matter_open_date)",
    owner: "legal_operations_manager",
    measurementFrequency: "monthly" as const,
    targetRange: { min: 30, max: 180, unit: "days" },
  },
  {
    key: "legal_client_acquisition_cost",
    label: "Client Acquisition Cost",
    description: "Average cost to acquire a new client",
    formulaPlaceholder: "total_marketing_spend / new_clients",
    owner: "legal_business_developer",
    measurementFrequency: "monthly" as const,
    targetRange: { min: 200, max: 1000, unit: "$" },
  },
  {
    key: "legal_client_retention_rate",
    label: "Client Retention Rate",
    description: "Percentage of clients returning for additional matters",
    formulaPlaceholder: "(returning_clients / total_clients) * 100",
    owner: "legal_client_relations_manager",
    measurementFrequency: "quarterly" as const,
    targetRange: { min: 60, max: 80, unit: "%" },
  },
  {
    key: "legal_accounts_receivable_days",
    label: "AR Days Outstanding",
    description: "Average days outstanding on accounts receivable",
    formulaPlaceholder: "(accounts_receivable / annual_revenue) * 365",
    owner: "legal_billing_manager",
    measurementFrequency: "monthly" as const,
    targetRange: { min: 30, max: 60, unit: "days" },
  },
  {
    key: "legal_new_matters_per_month",
    label: "New Matters Per Month",
    description: "Number of new client matters opened per month",
    formulaPlaceholder: "count(matters opened this month)",
    owner: "legal_business_developer",
    measurementFrequency: "monthly" as const,
    targetRange: { min: 10, max: 30, unit: "matters" },
  },
  {
    key: "legal_write_off_rate",
    label: "Write-Off Rate",
    description: "Percentage of billed time written off or written down",
    formulaPlaceholder: "(written_off_hours / billed_hours) * 100",
    owner: "legal_managing_partner",
    measurementFrequency: "monthly" as const,
    targetRange: { min: 0, max: 10, unit: "%" },
  },
  {
    key: "legal_referral_conversion_rate",
    label: "Referral Conversion Rate",
    description: "Percentage of referrals that become paying clients",
    formulaPlaceholder: "(converted_referrals / total_referrals) * 100",
    owner: "legal_business_developer",
    measurementFrequency: "monthly" as const,
    targetRange: { min: 40, max: 70, unit: "%" },
  },
];

export function seedKpis(): void {
  for (const kpi of kpis) {
    kpiRegistry.register(kpi);
  }
}
