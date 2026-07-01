import { kpiRegistry } from "@boss/registries";

const kpis = [
  {
    key: "hs_first_time_fix_rate",
    label: "First-Time Fix Rate",
    description: "Percentage of jobs completed without requiring a callback.",
    formulaPlaceholder: "jobs_completed_without_callback / total_jobs",
    owner: "Operations",
    measurementFrequency: "weekly" as const,
    targetRange: "> 85%",
  },
  {
    key: "hs_avg_response_time",
    label: "Average Response Time",
    description: "Average time from job request to technician arrival.",
    formulaPlaceholder: "avg(arrival_at - request_at)",
    owner: "Operations",
    measurementFrequency: "daily" as const,
    targetRange: "< 2 hours",
  },
  {
    key: "hs_technician_utilization",
    label: "Technician Utilization",
    description: "Percentage of available technician hours spent on billable work.",
    formulaPlaceholder: "billable_hours / available_hours",
    owner: "Operations",
    measurementFrequency: "weekly" as const,
    targetRange: "> 75%",
  },
  {
    key: "hs_estimate_acceptance_rate",
    label: "Estimate Acceptance Rate",
    description: "Percentage of estimates that are approved by customers.",
    formulaPlaceholder: "approved_estimates / total_estimates",
    owner: "Sales",
    measurementFrequency: "weekly" as const,
    targetRange: "> 65%",
  },
  {
    key: "hs_revenue_per_technician",
    label: "Revenue per Technician",
    description: "Average revenue generated per active technician per month.",
    formulaPlaceholder: "total_revenue / active_technician_count",
    owner: "Finance",
    measurementFrequency: "monthly" as const,
    targetRange: "> $12,000/month",
  },
  {
    key: "hs_avg_ticket_value",
    label: "Average Ticket Value",
    description: "Average invoice value per completed job.",
    formulaPlaceholder: "total_invoiced / completed_jobs",
    owner: "Finance",
    measurementFrequency: "weekly" as const,
    targetRange: "> $350",
  },
  {
    key: "hs_callback_rate",
    label: "Callback Rate",
    description: "Percentage of jobs requiring a return visit within 30 days.",
    formulaPlaceholder: "callback_jobs / completed_jobs",
    owner: "Operations",
    measurementFrequency: "weekly" as const,
    targetRange: "< 5%",
  },
  {
    key: "hs_maintenance_renewal_rate",
    label: "Maintenance Renewal Rate",
    description: "Percentage of maintenance plan agreements renewed at expiry.",
    formulaPlaceholder: "renewed_agreements / expired_agreements",
    owner: "Sales",
    measurementFrequency: "monthly" as const,
    targetRange: "> 70%",
  },
  {
    key: "hs_customer_satisfaction",
    label: "Customer Satisfaction Score",
    description: "Average customer satisfaction rating after job completion.",
    formulaPlaceholder: "avg(post_job_rating)",
    owner: "Customer Success",
    measurementFrequency: "weekly" as const,
    targetRange: "> 4.5 / 5",
  },
  {
    key: "hs_gross_margin_per_job",
    label: "Gross Margin per Job",
    description: "Revenue minus labor and materials cost per completed job.",
    formulaPlaceholder: "(job_revenue - labor_cost - materials_cost) / job_revenue",
    owner: "Finance",
    measurementFrequency: "monthly" as const,
    targetRange: "> 50%",
  },
];

export function seedKpis(): void {
  for (const kpi of kpis) {
    kpiRegistry.register(kpi);
  }
}
