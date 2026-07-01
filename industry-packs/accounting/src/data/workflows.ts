import { workflowRegistry } from "@boss/registries";

const workflows = [
  {
    key: "acct_client_onboarding",
    label: "Client Onboarding",
    description: "Engagement letter, data collection, access setup for new accounting clients",
    triggerType: "event" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["acct_new_clients_per_quarter"],
  },
  {
    key: "acct_engagement_scoping",
    label: "Engagement Scoping",
    description: "Define scope, timeline, and fees for a new client engagement",
    triggerType: "manual" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["acct_avg_engagement_value", "acct_write_off_rate"],
  },
  {
    key: "acct_monthly_bookkeeping",
    label: "Monthly Bookkeeping",
    description: "Transaction coding, bank reconciliation, and monthly close for bookkeeping clients",
    triggerType: "schedule" as const,
    relatedConstraints: ["acct_capacity_constraint"] as string[],
    relatedKpis: ["acct_billable_hours_pct", "acct_on_time_delivery_rate"],
  },
  {
    key: "acct_payroll_processing",
    label: "Payroll Processing",
    description: "Bi-weekly or monthly payroll processing and tax filing",
    triggerType: "schedule" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["acct_on_time_delivery_rate"],
  },
  {
    key: "acct_tax_return_preparation",
    label: "Tax Return Preparation",
    description: "Individual and business tax return preparation and filing",
    triggerType: "schedule" as const,
    relatedConstraints: ["acct_capacity_constraint"] as string[],
    relatedKpis: ["acct_billable_hours_pct", "acct_on_time_delivery_rate"],
  },
  {
    key: "acct_invoice_generation",
    label: "Invoice Generation",
    description: "Monthly billing for retainer and hourly clients",
    triggerType: "schedule" as const,
    relatedConstraints: ["acct_high_ar_days"] as string[],
    relatedKpis: ["acct_realization_rate", "acct_accounts_receivable_days"],
  },
  {
    key: "acct_payment_collection",
    label: "Payment Collection",
    description: "AR follow-up and payment processing for outstanding invoices",
    triggerType: "event" as const,
    relatedConstraints: ["acct_high_ar_days"] as string[],
    relatedKpis: ["acct_accounts_receivable_days", "acct_realization_rate"],
  },
  {
    key: "acct_client_status_meeting",
    label: "Client Status Meeting",
    description: "Quarterly business review and advisory conversation with key clients",
    triggerType: "schedule" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["acct_client_retention_rate"],
  },
  {
    key: "acct_deadline_tracking",
    label: "Deadline Tracking",
    description: "Monitor tax deadlines, extension filings, and compliance dates",
    triggerType: "schedule" as const,
    relatedConstraints: ["acct_compliance_risk"] as string[],
    relatedKpis: ["acct_on_time_delivery_rate"],
  },
  {
    key: "acct_referral_management",
    label: "Referral Management",
    description: "Track and follow up on referral sources and prospects",
    triggerType: "event" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["acct_referral_conversion_rate", "acct_new_clients_per_quarter"],
  },
  {
    key: "acct_billing_review",
    label: "Monthly Billing Review",
    description: "Partner review of write-offs, realization, utilization, and AR aging",
    triggerType: "schedule" as const,
    relatedConstraints: ["acct_high_write_offs"] as string[],
    relatedKpis: ["acct_write_off_rate", "acct_realization_rate", "acct_billable_hours_pct"],
  },
];

export function seedWorkflows(): void {
  for (const workflow of workflows) {
    workflowRegistry.register(workflow);
  }
}
