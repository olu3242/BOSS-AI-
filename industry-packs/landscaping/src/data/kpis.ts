import { kpiRegistry } from "@boss/registries";

const kpis = [
  {
    key: "lscape_revenue_per_crew_hour",
    label: "Revenue per Crew Hour",
    description: "Total revenue generated divided by total crew hours worked in the period.",
    formulaPlaceholder: "total_revenue / total_crew_hours",
    owner: "Finance",
    measurementFrequency: "weekly" as const,
    targetRange: "> $85/hour",
  },
  {
    key: "lscape_job_completion_rate",
    label: "Job Completion Rate",
    description: "Percentage of scheduled jobs that are completed on the scheduled date.",
    formulaPlaceholder: "completed_jobs / scheduled_jobs",
    owner: "Operations",
    measurementFrequency: "weekly" as const,
    targetRange: "> 95%",
  },
  {
    key: "lscape_customer_retention_rate",
    label: "Customer Retention Rate",
    description: "Percentage of customers from the prior season who continue service in the current season.",
    formulaPlaceholder: "returning_customers / prior_season_customers",
    owner: "Sales",
    measurementFrequency: "monthly" as const,
    targetRange: "> 80%",
  },
  {
    key: "lscape_avg_job_value",
    label: "Average Job Value",
    description: "Average revenue generated per completed job across all service types.",
    formulaPlaceholder: "total_revenue / completed_jobs",
    owner: "Finance",
    measurementFrequency: "monthly" as const,
    targetRange: "> $350",
  },
  {
    key: "lscape_equipment_utilization",
    label: "Equipment Utilization",
    description: "Percentage of available equipment hours that are actively deployed on jobs.",
    formulaPlaceholder: "active_equipment_hours / available_equipment_hours",
    owner: "Operations",
    measurementFrequency: "weekly" as const,
    targetRange: "> 75%",
  },
  {
    key: "lscape_material_cost_pct",
    label: "Material Cost %",
    description: "Materials and supply costs as a percentage of total revenue.",
    formulaPlaceholder: "material_costs / total_revenue",
    owner: "Finance",
    measurementFrequency: "monthly" as const,
    targetRange: "< 20%",
  },
  {
    key: "lscape_labor_cost_pct",
    label: "Labor Cost %",
    description: "Total crew labor costs (wages + burden) as a percentage of total revenue.",
    formulaPlaceholder: "total_labor_costs / total_revenue",
    owner: "Finance",
    measurementFrequency: "monthly" as const,
    targetRange: "< 35%",
  },
  {
    key: "lscape_estimate_conversion_rate",
    label: "Estimate Conversion Rate",
    description: "Percentage of estimates sent to prospects that convert into booked jobs.",
    formulaPlaceholder: "booked_jobs_from_estimates / total_estimates_sent",
    owner: "Sales",
    measurementFrequency: "monthly" as const,
    targetRange: "> 45%",
  },
  {
    key: "lscape_seasonal_revenue_index",
    label: "Seasonal Revenue Index",
    description: "Current month revenue relative to the baseline monthly average (1.0 = average).",
    formulaPlaceholder: "current_month_revenue / avg_monthly_revenue",
    owner: "Finance",
    measurementFrequency: "monthly" as const,
    targetRange: ">= 0.7 off-season, >= 1.3 peak",
  },
  {
    key: "lscape_online_review_rating",
    label: "Online Review Rating",
    description: "Average star rating across all major review platforms (Google, Yelp, Nextdoor).",
    formulaPlaceholder: "sum(review_scores) / count(reviews)",
    owner: "Marketing",
    measurementFrequency: "monthly" as const,
    targetRange: ">= 4.5 stars",
  },
];

export function seedKpis(): void {
  for (const kpi of kpis) {
    kpiRegistry.register(kpi);
  }
}
