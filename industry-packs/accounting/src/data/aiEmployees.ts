import { aiEmployeeRegistry } from "@boss/registries";

export function seedAiEmployees(): void {
  aiEmployeeRegistry.register({
    key: "acct_managing_partner",
    label: "Managing Partner AI",
    mission: "Oversee firm operations, staff utilization, and strategic direction of the practice",
    responsibilities: [
      "Monitor billable hours and utilization across all staff",
      "Review write-offs and billing exceptions",
      "Track firm-wide realization and revenue per staff",
      "Identify capacity constraints and hiring needs",
    ],
    capabilities: ["billing_analysis", "capacity_planning", "performance_reporting"],
    requiredTools: ["billing_system", "practice_management"],
    kpis: ["acct_billable_hours_pct", "acct_realization_rate", "acct_revenue_per_staff"],
    permissions: ["read:engagements", "read:billing", "write:reports"],
    escalationRules: [{ condition: "utilization < 65%", escalateTo: "owner", method: "notification" }],
    lifecycle: "available" as const,
  });

  aiEmployeeRegistry.register({
    key: "acct_billing_manager",
    label: "Billing Manager AI",
    mission: "Maximize revenue collection through disciplined billing and AR management",
    responsibilities: [
      "Generate and send monthly invoices",
      "Monitor and follow up on overdue accounts",
      "Track write-offs and adjustments",
      "Maintain billing records and payment history",
    ],
    capabilities: ["invoice_management", "ar_tracking", "payment_processing"],
    requiredTools: ["billing_system", "accounting_integration"],
    kpis: ["acct_accounts_receivable_days", "acct_realization_rate", "acct_write_off_rate"],
    permissions: ["read:billing", "write:invoices", "write:payments"],
    escalationRules: [{ condition: "ar_days > 45", escalateTo: "acct_managing_partner", method: "notification" }],
    lifecycle: "available" as const,
  });

  aiEmployeeRegistry.register({
    key: "acct_client_manager",
    label: "Client Manager AI",
    mission: "Ensure client satisfaction, drive retention, and identify expansion opportunities",
    responsibilities: [
      "Conduct quarterly business reviews with key clients",
      "Monitor client satisfaction signals",
      "Identify cross-sell and advisory opportunities",
      "Manage client onboarding experience",
    ],
    capabilities: ["client_communication", "retention_management", "advisory_identification"],
    requiredTools: ["crm_integration", "email_system"],
    kpis: ["acct_client_retention_rate", "acct_avg_engagement_value"],
    permissions: ["read:engagements", "write:communications", "read:clients"],
    escalationRules: [{ condition: "client_not_contacted_90d", escalateTo: "acct_managing_partner", method: "notification" }],
    lifecycle: "available" as const,
  });

  aiEmployeeRegistry.register({
    key: "acct_business_developer",
    label: "Business Development AI",
    mission: "Drive new client acquisition through referral network and targeted outreach",
    responsibilities: [
      "Track referral sources and conversion rates",
      "Follow up on new client inquiries",
      "Schedule networking and BD activities",
      "Manage prospect pipeline",
    ],
    capabilities: ["referral_management", "pipeline_tracking", "marketing_outreach"],
    requiredTools: ["crm_integration", "email_system"],
    kpis: ["acct_new_clients_per_quarter", "acct_referral_conversion_rate"],
    permissions: ["read:clients", "write:communications", "write:crm"],
    escalationRules: [{ condition: "new_clients_below_target", escalateTo: "acct_managing_partner", method: "alert" }],
    lifecycle: "available" as const,
  });

  aiEmployeeRegistry.register({
    key: "acct_operations_manager",
    label: "Operations Manager AI",
    mission: "Ensure on-time delivery of all client work and streamline firm workflows",
    responsibilities: [
      "Monitor all client deadlines and filing dates",
      "Track work in progress and project status",
      "Identify bottlenecks in the delivery pipeline",
      "Coordinate between staff on shared client accounts",
    ],
    capabilities: ["deadline_management", "workflow_tracking", "project_coordination"],
    requiredTools: ["practice_management", "calendar_integration"],
    kpis: ["acct_on_time_delivery_rate", "acct_billable_hours_pct"],
    permissions: ["read:engagements", "write:tasks", "write:calendar"],
    escalationRules: [{ condition: "deadline_within_72h_incomplete", escalateTo: "staff", method: "urgent_notification" }],
    lifecycle: "available" as const,
  });

  aiEmployeeRegistry.register({
    key: "acct_compliance_coordinator",
    label: "Compliance Coordinator AI",
    mission: "Track all regulatory deadlines and ensure zero missed filings",
    responsibilities: [
      "Monitor tax filing deadlines for all clients",
      "Track extension requests and approval status",
      "Alert staff to approaching compliance dates",
      "Maintain compliance calendar and audit trail",
    ],
    capabilities: ["compliance_tracking", "deadline_alerting", "regulatory_monitoring"],
    requiredTools: ["practice_management", "tax_software_integration"],
    kpis: ["acct_on_time_delivery_rate"],
    permissions: ["read:engagements", "write:alerts", "write:compliance_log"],
    escalationRules: [{ condition: "deadline_within_48h", escalateTo: "acct_operations_manager", method: "urgent_notification" }],
    lifecycle: "available" as const,
  });
}
