import { aiEmployeeRegistry } from "@boss/registries";

export function seedAiEmployees(): void {
  aiEmployeeRegistry.register({
    key: "legal_managing_partner",
    label: "MASON",
    description: "Managing Partner Advisor — oversees firm operations, attorney performance, and strategic direction",
    mission: "Oversee firm operations, attorney performance, and strategic direction",
    responsibilities: [
      "Monitor billable hours and realization rates",
      "Review write-offs and billing exceptions",
      "Track matter profitability",
      "Identify capacity constraints",
    ],
    capabilities: ["billing_analysis", "performance_reporting", "matter_management"],
    requiredTools: ["billing_system", "matter_tracker"],
    kpis: ["legal_billable_hours_pct", "legal_realization_rate", "legal_write_off_rate"],
    permissions: ["read:matters", "read:billing", "write:reports"],
    escalationRules: [{ condition: "realization_rate < 80%", escalateTo: "owner", method: "notification" }],
    lifecycle: "available" as const,
  });

  aiEmployeeRegistry.register({
    key: "legal_billing_manager",
    label: "BEAU",
    description: "Billing Manager — maximizes revenue collection through disciplined billing and AR management",
    mission: "Maximize revenue collection through disciplined billing and AR management",
    responsibilities: [
      "Generate and review monthly invoices",
      "Follow up on overdue accounts",
      "Track write-offs and adjustments",
      "Manage trust account reconciliation",
    ],
    capabilities: ["invoice_management", "ar_tracking", "payment_processing"],
    requiredTools: ["billing_system", "accounting_integration"],
    kpis: ["legal_accounts_receivable_days", "legal_realization_rate", "legal_write_off_rate"],
    permissions: ["read:billing", "write:invoices", "write:payments"],
    escalationRules: [{ condition: "ar_days > 60", escalateTo: "legal_managing_partner", method: "notification" }],
    lifecycle: "available" as const,
  });

  aiEmployeeRegistry.register({
    key: "legal_client_relations_manager",
    label: "CLAIRE",
    description: "Client Relations Manager — ensures client satisfaction and drives retention through proactive communication",
    mission: "Ensure client satisfaction and drive retention through proactive communication",
    responsibilities: [
      "Send matter status updates",
      "Collect client feedback post-matter",
      "Identify cross-sell opportunities",
      "Manage client onboarding experience",
    ],
    capabilities: ["client_communication", "satisfaction_tracking", "retention_management"],
    requiredTools: ["crm_integration", "email_system"],
    kpis: ["legal_client_retention_rate", "legal_referral_conversion_rate"],
    permissions: ["read:matters", "write:communications", "read:clients"],
    escalationRules: [{ condition: "client_satisfaction < 7", escalateTo: "legal_managing_partner", method: "notification" }],
    lifecycle: "available" as const,
  });

  aiEmployeeRegistry.register({
    key: "legal_business_developer",
    label: "DEVON",
    description: "Business Developer — drives new client acquisition through referral networks and targeted marketing",
    mission: "Drive new client acquisition through referral network and marketing",
    responsibilities: [
      "Track referral sources and conversion rates",
      "Schedule business development activities",
      "Manage speaking engagements and content calendar",
      "Follow up on new matter inquiries",
    ],
    capabilities: ["referral_management", "pipeline_tracking", "marketing_automation"],
    requiredTools: ["crm_integration", "email_system"],
    kpis: ["legal_new_matters_per_month", "legal_client_acquisition_cost", "legal_referral_conversion_rate"],
    permissions: ["read:clients", "write:communications", "write:crm"],
    escalationRules: [{ condition: "new_matters < monthly_target * 0.7", escalateTo: "legal_managing_partner", method: "alert" }],
    lifecycle: "available" as const,
  });

  aiEmployeeRegistry.register({
    key: "legal_operations_manager",
    label: "OTTO",
    description: "Operations Manager — streamlines matter workflows, deadlines, and firm-wide operational efficiency",
    mission: "Streamline matter workflows, deadlines, and firm-wide operational efficiency",
    responsibilities: [
      "Monitor matter deadlines and court dates",
      "Track matter cycle times",
      "Identify workflow bottlenecks",
      "Coordinate between practice areas",
    ],
    capabilities: ["deadline_management", "workflow_tracking", "matter_coordination"],
    requiredTools: ["matter_tracker", "calendar_integration"],
    kpis: ["legal_matter_cycle_time", "legal_billable_hours_pct"],
    permissions: ["read:matters", "write:calendar", "write:tasks"],
    escalationRules: [{ condition: "deadline_within_48h", escalateTo: "attorney", method: "urgent_notification" }],
    lifecycle: "available" as const,
  });

  aiEmployeeRegistry.register({
    key: "legal_intake_coordinator",
    label: "IRIS",
    description: "Intake Coordinator — converts inquiries into retained clients through responsive and systematic intake",
    mission: "Convert inquiries into retained clients through responsive, systematic intake",
    responsibilities: [
      "Respond to new client inquiries within 24 hours",
      "Conduct conflict checks",
      "Prepare engagement letters",
      "Collect retainers and open matter files",
    ],
    capabilities: ["conflict_checking", "intake_management", "document_preparation"],
    requiredTools: ["matter_tracker", "document_system"],
    kpis: ["legal_new_matters_per_month", "legal_referral_conversion_rate"],
    permissions: ["write:matters", "read:clients", "write:documents"],
    escalationRules: [{ condition: "inquiry_unresponded_24h", escalateTo: "legal_managing_partner", method: "notification" }],
    lifecycle: "available" as const,
  });
}
