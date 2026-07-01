import { workflowRegistry } from "@boss/registries";

const workflows = [
  {
    key: "legal_client_intake",
    label: "Client Intake",
    description: "Conflict check, engagement letter, retainer collection for new clients",
    triggerType: "event" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["legal_new_matters_per_month", "legal_client_acquisition_cost"],
  },
  {
    key: "legal_matter_opening",
    label: "Matter Opening",
    description: "Create matter file, assign attorney, set billing parameters",
    triggerType: "event" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["legal_new_matters_per_month"],
  },
  {
    key: "legal_time_entry",
    label: "Time Entry",
    description: "Daily attorney time capture and narrative description",
    triggerType: "schedule" as const,
    relatedConstraints: ["legal_low_billable_hours"] as string[],
    relatedKpis: ["legal_billable_hours_pct"],
  },
  {
    key: "legal_invoice_generation",
    label: "Invoice Generation",
    description: "Monthly bill generation, review, and delivery to clients",
    triggerType: "schedule" as const,
    relatedConstraints: ["legal_high_ar_days"] as string[],
    relatedKpis: ["legal_realization_rate", "legal_accounts_receivable_days"],
  },
  {
    key: "legal_payment_collection",
    label: "Payment Collection",
    description: "AR follow-up, payment processing, trust account management",
    triggerType: "event" as const,
    relatedConstraints: ["legal_high_ar_days"] as string[],
    relatedKpis: ["legal_accounts_receivable_days", "legal_realization_rate"],
  },
  {
    key: "legal_matter_update",
    label: "Matter Status Update",
    description: "Client status update communications on active matters",
    triggerType: "schedule" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["legal_client_retention_rate"],
  },
  {
    key: "legal_deadline_management",
    label: "Deadline Management",
    description: "Court deadlines, statute of limitations, and filing deadline tracking",
    triggerType: "schedule" as const,
    relatedConstraints: ["legal_compliance_risk"] as string[],
    relatedKpis: ["legal_matter_cycle_time"],
  },
  {
    key: "legal_matter_close",
    label: "Matter Closing",
    description: "Final billing, file closing, client satisfaction check, referral request",
    triggerType: "event" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["legal_matter_cycle_time", "legal_realization_rate"],
  },
  {
    key: "legal_referral_tracking",
    label: "Referral Tracking",
    description: "Log, thank, and follow up on referral sources",
    triggerType: "event" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["legal_referral_conversion_rate", "legal_new_matters_per_month"],
  },
  {
    key: "legal_business_development",
    label: "Business Development",
    description: "Networking activities, speaking engagements, content publishing",
    triggerType: "schedule" as const,
    relatedConstraints: ["legal_low_new_matters"] as string[],
    relatedKpis: ["legal_new_matters_per_month", "legal_client_acquisition_cost"],
  },
  {
    key: "legal_billing_review",
    label: "Monthly Billing Review",
    description: "Partner review of write-offs, realization, and AR aging report",
    triggerType: "schedule" as const,
    relatedConstraints: ["legal_high_write_offs"] as string[],
    relatedKpis: ["legal_write_off_rate", "legal_realization_rate", "legal_billable_hours_pct"],
  },
];

export function seedWorkflows(): void {
  for (const workflow of workflows) {
    workflowRegistry.register(workflow);
  }
}
