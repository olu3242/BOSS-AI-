import { decisionRegistry } from "@boss/registries";

export function seedDecisions(): void {
  decisionRegistry.register({
    key: "legal_increase_billing_rates",
    label: "Increase Billing Rates",
    description: "Raise hourly rates for attorneys to improve revenue per hour",
    category: "financial",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["legal_below_market_rates"],
    relatedKpiKeys: ["legal_avg_hourly_rate", "legal_realization_rate"],
    playbook: "legal_rate_increase_playbook",
    estimatedTimelineDays: 30,
  });

  decisionRegistry.register({
    key: "legal_hire_associate_attorney",
    label: "Hire Associate Attorney",
    description: "Add an associate attorney to increase capacity and revenue",
    category: "people",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["legal_capacity_constraint"],
    relatedKpiKeys: ["legal_billable_hours_pct", "legal_new_matters_per_month"],
    estimatedTimelineDays: 60,
  });

  decisionRegistry.register({
    key: "legal_launch_practice_area",
    label: "Launch New Practice Area",
    description: "Expand into an adjacent practice area to diversify revenue",
    category: "strategic",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["legal_revenue_concentration"],
    relatedKpiKeys: ["legal_new_matters_per_month", "legal_client_acquisition_cost"],
    estimatedTimelineDays: 90,
  });

  decisionRegistry.register({
    key: "legal_improve_ar_collection",
    label: "Improve AR Collection Process",
    description: "Implement systematic follow-up to reduce outstanding receivables",
    category: "operational",
    defaultSeverity: "high",
    approvalPolicy: "auto",
    relatedConstraintDefinitionKeys: ["legal_high_ar_days"],
    relatedKpiKeys: ["legal_accounts_receivable_days", "legal_realization_rate"],
    playbook: "legal_ar_collection_playbook",
    estimatedTimelineDays: 14,
  });

  decisionRegistry.register({
    key: "legal_build_referral_network",
    label: "Build Referral Network",
    description: "Formalize referral relationships with other attorneys and professionals",
    category: "marketing",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["legal_low_new_matters"],
    relatedKpiKeys: ["legal_referral_conversion_rate", "legal_new_matters_per_month"],
    playbook: "legal_referral_network_playbook",
    estimatedTimelineDays: 45,
  });

  decisionRegistry.register({
    key: "legal_adopt_legal_tech",
    label: "Adopt Legal Technology",
    description: "Implement practice management software to improve efficiency",
    category: "technology",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["legal_manual_processes"],
    relatedKpiKeys: ["legal_billable_hours_pct", "legal_matter_cycle_time"],
    estimatedTimelineDays: 60,
  });

  decisionRegistry.register({
    key: "legal_reduce_write_offs",
    label: "Reduce Write-Offs",
    description: "Address root causes of excessive write-offs through better intake and billing discipline",
    category: "financial",
    defaultSeverity: "medium",
    approvalPolicy: "auto",
    relatedConstraintDefinitionKeys: ["legal_high_write_offs"],
    relatedKpiKeys: ["legal_write_off_rate", "legal_realization_rate"],
    playbook: "legal_write_off_reduction_playbook",
    estimatedTimelineDays: 21,
  });

  decisionRegistry.register({
    key: "legal_client_satisfaction_program",
    label: "Launch Client Satisfaction Program",
    description: "Implement systematic client feedback and retention touchpoints",
    category: "customer",
    defaultSeverity: "medium",
    approvalPolicy: "auto",
    relatedConstraintDefinitionKeys: ["legal_low_client_retention"],
    relatedKpiKeys: ["legal_client_retention_rate", "legal_referral_conversion_rate"],
    estimatedTimelineDays: 21,
  });
}
