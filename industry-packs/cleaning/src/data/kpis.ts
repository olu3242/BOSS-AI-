import { kpiRegistry } from "@boss/registries";

const kpis = [
  {
    key: "clean_revenue_per_cleaner_hour",
    label: "Revenue per Cleaner Hour",
    description: "Total revenue generated per cleaner hour worked, measuring labor productivity.",
    formulaPlaceholder: "total_revenue / total_cleaner_hours_worked",
    owner: "Finance",
    measurementFrequency: "weekly" as const,
    targetRange: "> $35/hour",
  },
  {
    key: "clean_job_completion_rate",
    label: "Job Completion Rate",
    description: "Percentage of scheduled jobs that are completed successfully without cancellation or abandonment.",
    formulaPlaceholder: "completed_jobs / scheduled_jobs",
    owner: "Operations",
    measurementFrequency: "weekly" as const,
    targetRange: "> 97%",
  },
  {
    key: "clean_customer_retention_rate",
    label: "Customer Retention Rate",
    description: "Percentage of clients who continue using the service after their initial booking.",
    formulaPlaceholder: "returning_clients / total_clients_at_period_start",
    owner: "Sales",
    measurementFrequency: "monthly" as const,
    targetRange: "> 80%",
  },
  {
    key: "clean_avg_job_value",
    label: "Average Job Value",
    description: "Average revenue generated per cleaning job, reflecting pricing and upsell effectiveness.",
    formulaPlaceholder: "total_revenue / total_jobs_completed",
    owner: "Finance",
    measurementFrequency: "monthly" as const,
    targetRange: "> $150",
  },
  {
    key: "clean_cleaner_utilization",
    label: "Cleaner Utilization",
    description: "Percentage of available cleaner hours actually spent on billable jobs.",
    formulaPlaceholder: "billable_hours / available_hours",
    owner: "Operations",
    measurementFrequency: "weekly" as const,
    targetRange: "> 75%",
  },
  {
    key: "clean_supply_cost_pct",
    label: "Supply Cost as % of Revenue",
    description: "Cleaning supply expenses expressed as a percentage of total revenue.",
    formulaPlaceholder: "supply_expenses / total_revenue",
    owner: "Finance",
    measurementFrequency: "monthly" as const,
    targetRange: "< 10%",
  },
  {
    key: "clean_labor_cost_pct",
    label: "Labor Cost as % of Revenue",
    description: "Total labor costs expressed as a percentage of total revenue.",
    formulaPlaceholder: "labor_costs / total_revenue",
    owner: "Finance",
    measurementFrequency: "monthly" as const,
    targetRange: "< 45%",
  },
  {
    key: "clean_quality_score",
    label: "Quality Inspection Score",
    description: "Average quality score from post-job inspections rated on a 0–100 scale.",
    formulaPlaceholder: "sum(inspection_scores) / count(inspections)",
    owner: "Operations",
    measurementFrequency: "weekly" as const,
    targetRange: "> 90",
  },
  {
    key: "clean_complaint_rate",
    label: "Complaint Rate per 100 Jobs",
    description: "Number of customer complaints received per 100 jobs completed.",
    formulaPlaceholder: "(complaints / completed_jobs) * 100",
    owner: "Operations",
    measurementFrequency: "monthly" as const,
    targetRange: "< 2",
  },
  {
    key: "clean_on_time_arrival_rate",
    label: "On-Time Arrival Rate",
    description: "Percentage of jobs where the cleaning team arrives within the agreed window.",
    formulaPlaceholder: "on_time_arrivals / total_jobs",
    owner: "Operations",
    measurementFrequency: "weekly" as const,
    targetRange: "> 95%",
  },
];

export function seedKpis(): void {
  for (const kpi of kpis) {
    kpiRegistry.register(kpi);
  }
}
