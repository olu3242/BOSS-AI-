import { workflowRegistry } from "@boss/registries";

const workflows = [
  {
    key: "clean_new_client_onboarding",
    label: "New Client Onboarding",
    description: "Collect client details, property information, service preferences, and access instructions when a new client books.",
    triggerType: "event" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["clean_customer_retention_rate"],
  },
  {
    key: "clean_quote_generation",
    label: "Quote Generation",
    description: "Generate accurate job quotes based on property size, service type, frequency, and add-ons requested.",
    triggerType: "manual" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["clean_avg_job_value"],
  },
  {
    key: "clean_job_scheduling",
    label: "Job Scheduling",
    description: "Schedule cleaning jobs by matching client requirements with available cleaners and route efficiency.",
    triggerType: "event" as const,
    relatedConstraints: ["clean_cleaner_utilization_low"],
    relatedKpis: ["clean_cleaner_utilization", "clean_on_time_arrival_rate"],
  },
  {
    key: "clean_cleaner_dispatch",
    label: "Cleaner Dispatch",
    description: "Dispatch cleaners with job details, access codes, and checklists each morning on a scheduled basis.",
    triggerType: "schedule" as const,
    relatedConstraints: ["clean_no_show_rate_high"],
    relatedKpis: ["clean_on_time_arrival_rate", "clean_job_completion_rate"],
  },
  {
    key: "clean_job_execution_checklist",
    label: "Job Execution Checklist",
    description: "Guide cleaners through a standardized room-by-room checklist to ensure consistent service quality.",
    triggerType: "manual" as const,
    relatedConstraints: ["clean_quality_score_low"],
    relatedKpis: ["clean_quality_score", "clean_complaint_rate"],
  },
  {
    key: "clean_quality_inspection",
    label: "Quality Inspection",
    description: "Conduct post-job quality inspections and capture scores to monitor service standards.",
    triggerType: "event" as const,
    relatedConstraints: ["clean_quality_score_low", "clean_complaint_rate_high"],
    relatedKpis: ["clean_quality_score", "clean_complaint_rate"],
  },
  {
    key: "clean_invoice_generation",
    label: "Invoice Generation",
    description: "Automatically generate and send invoices to clients immediately after job completion.",
    triggerType: "event" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["clean_avg_job_value", "clean_revenue_per_cleaner_hour"],
  },
  {
    key: "clean_payment_collection",
    label: "Payment Collection",
    description: "Collect payment from clients via card on file or digital invoice upon job completion.",
    triggerType: "event" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["clean_revenue_per_cleaner_hour", "clean_avg_job_value"],
  },
  {
    key: "clean_complaint_resolution",
    label: "Complaint Resolution",
    description: "Acknowledge, investigate, and resolve customer complaints with remediation and follow-up confirmation.",
    triggerType: "event" as const,
    relatedConstraints: ["clean_complaint_rate_high", "clean_customer_churn_high"],
    relatedKpis: ["clean_complaint_rate", "clean_customer_retention_rate"],
  },
  {
    key: "clean_recurring_schedule_management",
    label: "Recurring Schedule Management",
    description: "Automatically manage recurring client bookings, send reminders, and adjust for holidays or exceptions.",
    triggerType: "schedule" as const,
    relatedConstraints: ["clean_customer_churn_high"],
    relatedKpis: ["clean_customer_retention_rate", "clean_cleaner_utilization"],
  },
  {
    key: "clean_supply_reorder",
    label: "Supply Reorder",
    description: "Monitor supply inventory levels and automatically trigger reorder when stock falls below threshold.",
    triggerType: "schedule" as const,
    relatedConstraints: ["clean_supply_costs_high"],
    relatedKpis: ["clean_supply_cost_pct"],
  },
];

export function seedWorkflows(): void {
  for (const workflow of workflows) {
    workflowRegistry.register(workflow);
  }
}
