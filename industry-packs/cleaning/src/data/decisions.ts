import { decisionRegistry } from "@boss/registries";

export function seedDecisions(): void {
  decisionRegistry.register({
    key: "clean_hire_cleaning_team",
    label: "Hire Additional Cleaning Team",
    description: "Bring on additional cleaners to meet growing demand, increase capacity, and reduce cleaner overload.",
    category: "people",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["clean_cleaner_utilization_low", "clean_labor_cost_high"],
    relatedKpiKeys: ["clean_cleaner_utilization", "clean_labor_cost_pct"],
    estimatedTimelineDays: 30,
  });

  decisionRegistry.register({
    key: "clean_expand_service_area",
    label: "Expand Service Area",
    description: "Extend geographic coverage to capture new markets, requiring route planning and marketing investment.",
    category: "strategic",
    defaultSeverity: "medium",
    approvalPolicy: "executive_team",
    relatedConstraintDefinitionKeys: ["clean_cleaner_utilization_low"],
    relatedKpiKeys: ["clean_revenue_per_cleaner_hour", "clean_cleaner_utilization"],
    estimatedTimelineDays: 60,
  });

  decisionRegistry.register({
    key: "clean_add_specialty_service",
    label: "Add Specialty Service",
    description: "Launch a new specialty service such as carpet cleaning, window washing, or pressure washing to increase average job value.",
    category: "strategic",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: [] as string[],
    relatedKpiKeys: ["clean_avg_job_value", "clean_revenue_per_cleaner_hour"],
    estimatedTimelineDays: 45,
  });

  decisionRegistry.register({
    key: "clean_raise_rates",
    label: "Raise Service Rates",
    description: "Increase pricing to improve margins, accounting for supply and labor cost increases.",
    category: "financial",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["clean_labor_cost_high", "clean_supply_costs_high"],
    relatedKpiKeys: ["clean_revenue_per_cleaner_hour", "clean_avg_job_value"],
    estimatedTimelineDays: 14,
  });

  decisionRegistry.register({
    key: "clean_pursue_commercial_contracts",
    label: "Pursue Commercial Contracts",
    description: "Target commercial clients such as offices, medical facilities, and retail stores for high-value recurring contracts.",
    category: "marketing",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["clean_cleaner_utilization_low"],
    relatedKpiKeys: ["clean_avg_job_value", "clean_cleaner_utilization", "clean_revenue_per_cleaner_hour"],
    playbook: "clean_commercial_expansion_playbook",
    estimatedTimelineDays: 90,
  });

  decisionRegistry.register({
    key: "clean_invest_in_equipment",
    label: "Invest in Equipment",
    description: "Purchase professional-grade equipment to improve cleaning quality, job speed, and ability to offer specialty services.",
    category: "financial",
    defaultSeverity: "low",
    approvalPolicy: "executive_team",
    relatedConstraintDefinitionKeys: ["clean_quality_score_low"],
    relatedKpiKeys: ["clean_quality_score", "clean_revenue_per_cleaner_hour"],
    estimatedTimelineDays: 21,
  });

  decisionRegistry.register({
    key: "clean_implement_quality_program",
    label: "Implement Quality Assurance Program",
    description: "Roll out formal quality inspection checklists, post-job surveys, and cleaner performance scoring.",
    category: "operational",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["clean_quality_score_low", "clean_complaint_rate_high"],
    relatedKpiKeys: ["clean_quality_score", "clean_complaint_rate", "clean_customer_retention_rate"],
    playbook: "clean_quality_recovery_playbook",
    estimatedTimelineDays: 14,
  });

  decisionRegistry.register({
    key: "clean_launch_referral_program",
    label: "Launch Referral Program",
    description: "Incentivize existing clients to refer new customers with discounts or rewards for successful referrals.",
    category: "marketing",
    defaultSeverity: "low",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["clean_customer_churn_high"],
    relatedKpiKeys: ["clean_customer_retention_rate", "clean_avg_job_value"],
    estimatedTimelineDays: 14,
  });
}
