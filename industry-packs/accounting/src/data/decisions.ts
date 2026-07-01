import { decisionRegistry } from "@boss/registries";

export function seedDecisions(): void {
  decisionRegistry.register({
    key: "acct_increase_billing_rates",
    label: "Increase Billing Rates",
    description: "Raise hourly rates or retainer fees to improve revenue per engagement",
    category: "financial",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["acct_below_market_rates"],
    relatedKpiKeys: ["acct_avg_engagement_value", "acct_realization_rate"],
    playbook: "acct_rate_increase_playbook",
    estimatedTimelineDays: 30,
  });

  decisionRegistry.register({
    key: "acct_hire_staff_accountant",
    label: "Hire Staff Accountant",
    description: "Add a staff accountant to expand capacity for new client engagements",
    category: "people",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["acct_capacity_constraint"],
    relatedKpiKeys: ["acct_billable_hours_pct", "acct_new_clients_per_quarter"],
    estimatedTimelineDays: 60,
  });

  decisionRegistry.register({
    key: "acct_launch_advisory_services",
    label: "Launch Advisory Services",
    description: "Move up the value chain from compliance to strategic advisory engagements",
    category: "strategic",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["acct_low_avg_engagement_value"],
    relatedKpiKeys: ["acct_avg_engagement_value", "acct_revenue_per_staff"],
    estimatedTimelineDays: 90,
  });

  decisionRegistry.register({
    key: "acct_improve_ar_collection",
    label: "Improve AR Collection",
    description: "Implement systematic AR follow-up to reduce outstanding receivables",
    category: "operational",
    defaultSeverity: "high",
    approvalPolicy: "auto",
    relatedConstraintDefinitionKeys: ["acct_high_ar_days"],
    relatedKpiKeys: ["acct_accounts_receivable_days", "acct_realization_rate"],
    playbook: "acct_ar_collection_playbook",
    estimatedTimelineDays: 14,
  });

  decisionRegistry.register({
    key: "acct_build_referral_network",
    label: "Build Referral Network",
    description: "Formalize referral relationships with attorneys, financial advisors, and bankers",
    category: "marketing",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["acct_low_new_clients"],
    relatedKpiKeys: ["acct_referral_conversion_rate", "acct_new_clients_per_quarter"],
    playbook: "acct_referral_playbook",
    estimatedTimelineDays: 45,
  });

  decisionRegistry.register({
    key: "acct_adopt_accounting_tech",
    label: "Adopt Modern Accounting Technology",
    description: "Implement cloud accounting, workflow automation, and client portal tools",
    category: "technology",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["acct_manual_processes"],
    relatedKpiKeys: ["acct_billable_hours_pct", "acct_on_time_delivery_rate"],
    estimatedTimelineDays: 60,
  });

  decisionRegistry.register({
    key: "acct_reduce_write_offs",
    label: "Reduce Write-Offs",
    description: "Address root causes of excessive write-offs through better scoping and billing discipline",
    category: "financial",
    defaultSeverity: "medium",
    approvalPolicy: "auto",
    relatedConstraintDefinitionKeys: ["acct_high_write_offs"],
    relatedKpiKeys: ["acct_write_off_rate", "acct_realization_rate"],
    estimatedTimelineDays: 21,
  });

  decisionRegistry.register({
    key: "acct_client_retention_program",
    label: "Launch Client Retention Program",
    description: "Implement proactive client communication and annual business review program",
    category: "customer",
    defaultSeverity: "medium",
    approvalPolicy: "auto",
    relatedConstraintDefinitionKeys: ["acct_low_client_retention"],
    relatedKpiKeys: ["acct_client_retention_rate", "acct_referral_conversion_rate"],
    estimatedTimelineDays: 21,
  });
}
