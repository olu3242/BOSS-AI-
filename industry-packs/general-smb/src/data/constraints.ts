import { constraintRegistry } from "@boss/registries";

const constraints = [
  { key: "missed_leads", label: "Missed Leads", description: "Inbound leads go uncontacted.", relatedCapabilities: ["lead_management", "communication"] },
  { key: "slow_follow_up", label: "Slow Follow-Up", description: "Leads/customers wait too long for a response.", relatedCapabilities: ["lead_management", "communication"] },
  { key: "manual_scheduling", label: "Manual Scheduling", description: "Appointments are booked by hand, prone to error.", relatedCapabilities: ["scheduling"] },
  { key: "administrative_overload", label: "Administrative Overload", description: "Owner/staff time consumed by admin work.", relatedCapabilities: ["task_management", "documents"] },
  { key: "low_reviews", label: "Low Reviews", description: "Few or low-quality customer reviews.", relatedCapabilities: ["reviews"] },
  { key: "poor_customer_retention", label: "Poor Customer Retention", description: "Customers churn after one engagement.", relatedCapabilities: ["customer_management"] },
  { key: "owner_bottleneck", label: "Owner Bottleneck", description: "Too many decisions route through the owner.", relatedCapabilities: ["operations", "team_collaboration"] },
  { key: "poor_reporting", label: "Poor Reporting", description: "No reliable visibility into performance.", relatedCapabilities: ["reporting"] },
  { key: "limited_visibility", label: "Limited Visibility", description: "Owner lacks a single view of the business.", relatedCapabilities: ["reporting"] },
  { key: "outstanding_invoices", label: "Outstanding Invoices", description: "Unpaid invoices hurt cash flow.", relatedCapabilities: ["billing", "finance"] },
] as const;

export function seedConstraints(): void {
  for (const constraint of constraints) {
    constraintRegistry.register({ ...constraint, relatedCapabilities: [...constraint.relatedCapabilities] });
  }
}
