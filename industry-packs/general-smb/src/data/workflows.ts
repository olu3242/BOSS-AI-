import { workflowRegistry } from "@boss/registries";
import type { WorkflowDefinitionEntry } from "@boss/registries";

const workflows: WorkflowDefinitionEntry[] = [
  { key: "lead_follow_up_recovery", label: "Lead Follow-Up Recovery", description: "Re-engage leads that have gone cold.", triggerType: "event", relatedConstraints: ["missed_leads", "slow_follow_up"], relatedKpis: ["lead_response_time", "lead_conversion_rate"] },
  { key: "appointment_reminder", label: "Appointment Reminder", description: "Remind customers of upcoming appointments.", triggerType: "schedule", relatedConstraints: ["manual_scheduling"], relatedKpis: ["customer_retention"] },
  { key: "customer_re_engagement", label: "Customer Re-engagement", description: "Win back customers who haven't returned.", triggerType: "schedule", relatedConstraints: ["poor_customer_retention"], relatedKpis: ["customer_retention"] },
  { key: "invoice_follow_up", label: "Invoice Follow-Up", description: "Chase outstanding invoices automatically.", triggerType: "schedule", relatedConstraints: ["outstanding_invoices"], relatedKpis: ["outstanding_invoices"] },
  { key: "review_request", label: "Review Request", description: "Ask satisfied customers for a review.", triggerType: "event", relatedConstraints: ["low_reviews"], relatedKpis: ["review_rating"] },
  { key: "administrative_automation", label: "Administrative Automation", description: "Automate repetitive administrative tasks.", triggerType: "manual", relatedConstraints: ["administrative_overload", "owner_bottleneck"], relatedKpis: ["administrative_hours"] },
];

export function seedWorkflows(): void {
  for (const workflow of workflows) {
    workflowRegistry.register(workflow);
  }
}
