import { decisionRegistry } from "@boss/registries";

export function seedDecisions(): void {
  decisionRegistry.register({
    key: "lscape_expand_service_territory",
    label: "Expand Service Territory",
    description: "Add new zip codes or neighborhoods to the service area to grow the customer base and improve route density.",
    category: "strategic",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["lscape_seasonal_revenue_gap"],
    relatedKpiKeys: ["lscape_revenue_per_crew_hour", "lscape_seasonal_revenue_index"],
    estimatedTimelineDays: 60,
  });

  decisionRegistry.register({
    key: "lscape_hire_seasonal_crew",
    label: "Hire Seasonal Crew",
    description: "Bring on additional seasonal crew members to handle peak season demand without over-staffing in the off-season.",
    category: "people",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["lscape_crew_utilization_low", "lscape_labor_cost_high"],
    relatedKpiKeys: ["lscape_labor_cost_pct", "lscape_revenue_per_crew_hour"],
    playbook: "lscape_slow_season_playbook",
    estimatedTimelineDays: 30,
  });

  decisionRegistry.register({
    key: "lscape_raise_service_prices",
    label: "Raise Service Prices",
    description: "Increase pricing on key service lines to improve margins while maintaining competitive positioning.",
    category: "financial",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["lscape_material_costs_high", "lscape_labor_cost_high"],
    relatedKpiKeys: ["lscape_avg_job_value", "lscape_material_cost_pct", "lscape_labor_cost_pct"],
    estimatedTimelineDays: 14,
  });

  decisionRegistry.register({
    key: "lscape_add_service_line",
    label: "Add New Service Line",
    description: "Introduce a new service (e.g., irrigation, hardscaping, snow removal) to diversify revenue and reduce seasonal dependency.",
    category: "strategic",
    defaultSeverity: "medium",
    approvalPolicy: "executive_team",
    relatedConstraintDefinitionKeys: ["lscape_seasonal_revenue_gap"],
    relatedKpiKeys: ["lscape_seasonal_revenue_index", "lscape_avg_job_value"],
    playbook: "lscape_slow_season_playbook",
    estimatedTimelineDays: 90,
  });

  decisionRegistry.register({
    key: "lscape_equipment_purchase",
    label: "Purchase New Equipment",
    description: "Invest in new or replacement equipment to reduce breakdown frequency and improve crew productivity.",
    category: "financial",
    defaultSeverity: "high",
    approvalPolicy: "executive_team",
    relatedConstraintDefinitionKeys: ["lscape_equipment_breakdown_high"],
    relatedKpiKeys: ["lscape_equipment_utilization", "lscape_revenue_per_crew_hour"],
    playbook: "lscape_equipment_reliability_playbook",
    estimatedTimelineDays: 21,
  });

  decisionRegistry.register({
    key: "lscape_pursue_commercial_contracts",
    label: "Pursue Commercial Contracts",
    description: "Target commercial property managers and HOAs for recurring maintenance contracts to stabilize revenue.",
    category: "marketing",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["lscape_seasonal_revenue_gap", "lscape_customer_churn_high"],
    relatedKpiKeys: ["lscape_customer_retention_rate", "lscape_seasonal_revenue_index"],
    estimatedTimelineDays: 60,
  });

  decisionRegistry.register({
    key: "lscape_reduce_material_costs",
    label: "Reduce Material Costs",
    description: "Renegotiate supplier contracts, consolidate purchasing, or switch to alternative materials to bring material costs below 20%.",
    category: "operational",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["lscape_material_costs_high"],
    relatedKpiKeys: ["lscape_material_cost_pct", "lscape_avg_job_value"],
    estimatedTimelineDays: 30,
  });

  decisionRegistry.register({
    key: "lscape_launch_referral_program",
    label: "Launch Referral Program",
    description: "Create a formal customer referral incentive program to grow the customer base through word-of-mouth.",
    category: "marketing",
    defaultSeverity: "low",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["lscape_customer_churn_high", "lscape_estimate_conversion_low"],
    relatedKpiKeys: ["lscape_customer_retention_rate", "lscape_online_review_rating"],
    playbook: "lscape_customer_retention_playbook",
    estimatedTimelineDays: 21,
  });
}
