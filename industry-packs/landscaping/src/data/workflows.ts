import { workflowRegistry } from "@boss/registries";

const workflows = [
  {
    key: "lscape_estimate_request",
    label: "Estimate Request",
    description: "Capture and qualify inbound estimate requests from prospects via web form, phone, or referral.",
    triggerType: "event" as const,
    relatedConstraints: ["lscape_estimate_conversion_low"] as string[],
    relatedKpis: ["lscape_estimate_conversion_rate"],
  },
  {
    key: "lscape_estimate_creation",
    label: "Estimate Creation",
    description: "Conduct site visit, measure property, scope work, and generate a detailed estimate for the customer.",
    triggerType: "manual" as const,
    relatedConstraints: ["lscape_estimate_conversion_low"] as string[],
    relatedKpis: ["lscape_estimate_conversion_rate", "lscape_avg_job_value"],
  },
  {
    key: "lscape_job_scheduling",
    label: "Job Scheduling",
    description: "Assign accepted jobs to crews based on location, workload, and equipment availability.",
    triggerType: "event" as const,
    relatedConstraints: ["lscape_crew_utilization_low"] as string[],
    relatedKpis: ["lscape_job_completion_rate", "lscape_revenue_per_crew_hour"],
  },
  {
    key: "lscape_crew_dispatch",
    label: "Crew Dispatch",
    description: "Send daily job assignments to crew leaders including route, scope of work, and equipment checklist.",
    triggerType: "schedule" as const,
    relatedConstraints: ["lscape_crew_utilization_low"] as string[],
    relatedKpis: ["lscape_revenue_per_crew_hour", "lscape_equipment_utilization"],
  },
  {
    key: "lscape_job_execution",
    label: "Job Execution",
    description: "Track job progress in the field: crew check-in, work completion, materials used, and photos.",
    triggerType: "manual" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["lscape_job_completion_rate", "lscape_material_cost_pct"],
  },
  {
    key: "lscape_job_completion_signoff",
    label: "Job Completion Sign-Off",
    description: "Capture customer sign-off on completed work and trigger post-job satisfaction check.",
    triggerType: "event" as const,
    relatedConstraints: ["lscape_customer_churn_high"] as string[],
    relatedKpis: ["lscape_job_completion_rate", "lscape_customer_retention_rate"],
  },
  {
    key: "lscape_invoice_generation",
    label: "Invoice Generation",
    description: "Auto-generate and send invoice to customer upon job completion sign-off.",
    triggerType: "event" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["lscape_avg_job_value", "lscape_revenue_per_crew_hour"],
  },
  {
    key: "lscape_payment_collection",
    label: "Payment Collection",
    description: "Follow up on outstanding invoices and process customer payments.",
    triggerType: "event" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["lscape_avg_job_value"],
  },
  {
    key: "lscape_weekly_crew_review",
    label: "Weekly Crew Performance Review",
    description: "Review crew productivity metrics, job completion rates, and customer feedback each week.",
    triggerType: "schedule" as const,
    relatedConstraints: ["lscape_crew_utilization_low", "lscape_labor_cost_high"] as string[],
    relatedKpis: ["lscape_revenue_per_crew_hour", "lscape_labor_cost_pct"],
  },
  {
    key: "lscape_equipment_maintenance",
    label: "Equipment Maintenance",
    description: "Schedule and track preventive maintenance on all equipment to minimize downtime.",
    triggerType: "schedule" as const,
    relatedConstraints: ["lscape_equipment_breakdown_high"] as string[],
    relatedKpis: ["lscape_equipment_utilization"],
  },
  {
    key: "lscape_seasonal_planning",
    label: "Seasonal Planning",
    description: "Plan staffing, equipment, and service offerings for the upcoming season based on forecast demand.",
    triggerType: "schedule" as const,
    relatedConstraints: ["lscape_seasonal_revenue_gap"] as string[],
    relatedKpis: ["lscape_seasonal_revenue_index", "lscape_labor_cost_pct"],
  },
];

export function seedWorkflows(): void {
  for (const workflow of workflows) {
    workflowRegistry.register(workflow);
  }
}
