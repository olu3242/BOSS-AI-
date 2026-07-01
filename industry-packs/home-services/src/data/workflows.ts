import { workflowRegistry } from "@boss/registries";
import type { WorkflowDefinitionEntry } from "@boss/registries";

const workflows: WorkflowDefinitionEntry[] = [
  {
    key: "hs_lead_intake",
    label: "Lead Intake",
    description: "Capture inbound service request, qualify the lead, and create a job record.",
    triggerType: "event",
    relatedConstraints: ["slow_lead_response"],
    relatedKpis: ["hs_avg_response_time", "lead_response_time"],
  },
  {
    key: "hs_estimate_creation",
    label: "Estimate Creation",
    description: "Generate a detailed service estimate based on job type and technician assessment.",
    triggerType: "manual",
    relatedConstraints: [],
    relatedKpis: ["hs_estimate_acceptance_rate", "hs_avg_ticket_value"],
  },
  {
    key: "hs_quote_approval",
    label: "Quote Approval",
    description: "Send estimate to customer, collect approval or negotiation, and confirm scope.",
    triggerType: "event",
    relatedConstraints: [],
    relatedKpis: ["hs_estimate_acceptance_rate"],
  },
  {
    key: "hs_job_scheduling",
    label: "Job Scheduling",
    description: "Schedule approved job, assign time slot, and confirm with customer.",
    triggerType: "event",
    relatedConstraints: ["hs_low_technician_utilization"],
    relatedKpis: ["hs_technician_utilization", "hs_avg_response_time"],
  },
  {
    key: "hs_technician_dispatch",
    label: "Technician Dispatch",
    description: "Assign best-fit technician to job based on skills, location, and availability.",
    triggerType: "event",
    relatedConstraints: ["hs_missed_dispatch"],
    relatedKpis: ["hs_technician_utilization", "hs_avg_response_time"],
  },
  {
    key: "hs_emergency_dispatch",
    label: "Emergency Dispatch",
    description: "Priority routing for emergency service requests — same-day response guaranteed.",
    triggerType: "event",
    relatedConstraints: ["hs_missed_dispatch"],
    relatedKpis: ["hs_avg_response_time", "hs_customer_satisfaction"],
  },
  {
    key: "hs_job_execution",
    label: "Job Execution",
    description: "Technician completes job, logs time and materials, and captures customer sign-off.",
    triggerType: "manual",
    relatedConstraints: ["hs_callback_rate_high"],
    relatedKpis: ["hs_first_time_fix_rate", "hs_gross_margin_per_job"],
  },
  {
    key: "hs_quality_verification",
    label: "Quality Verification",
    description: "Post-job check: confirm completion, review technician notes, flag any issues.",
    triggerType: "event",
    relatedConstraints: ["hs_callback_rate_high"],
    relatedKpis: ["hs_first_time_fix_rate", "hs_customer_satisfaction"],
  },
  {
    key: "hs_invoice_generation",
    label: "Invoice Generation",
    description: "Auto-generate invoice from completed job record and send to customer.",
    triggerType: "event",
    relatedConstraints: ["outstanding_invoices"],
    relatedKpis: ["hs_avg_ticket_value", "outstanding_invoices"],
  },
  {
    key: "hs_payment_confirmation",
    label: "Payment Confirmation",
    description: "Collect payment, send receipt, and update job status to closed.",
    triggerType: "event",
    relatedConstraints: ["outstanding_invoices", "cash_flow_pressure"],
    relatedKpis: ["hs_gross_margin_per_job", "outstanding_invoices"],
  },
  {
    key: "hs_maintenance_follow_up",
    label: "Maintenance Follow-Up",
    description: "Offer maintenance plan after job completion; schedule annual check-ups.",
    triggerType: "event",
    relatedConstraints: ["hs_low_maintenance_renewal"],
    relatedKpis: ["hs_maintenance_renewal_rate", "hs_revenue_per_technician"],
  },
];

export function seedWorkflows(): void {
  for (const workflow of workflows) {
    workflowRegistry.register(workflow);
  }
}
