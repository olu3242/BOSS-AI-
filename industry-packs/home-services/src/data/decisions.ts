import { decisionRegistry } from "@boss/registries";

export function seedDecisions(): void {
  decisionRegistry.register({
    key: "hs_hire_technician",
    label: "Hire Another Technician",
    description: "Add field capacity when utilization exceeds 80% for two consecutive weeks.",
    category: "people",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["hs_low_technician_utilization"],
    relatedKpiKeys: ["hs_technician_utilization", "hs_revenue_per_technician"],
    playbook: "hs_hiring_playbook",
    estimatedTimelineDays: 30,
  });

  decisionRegistry.register({
    key: "hs_rebalance_schedules",
    label: "Rebalance Technician Schedules",
    description: "Redistribute job assignments to balance workload and reduce travel time.",
    category: "operational",
    defaultSeverity: "medium",
    approvalPolicy: "auto",
    relatedConstraintDefinitionKeys: ["hs_low_technician_utilization", "hs_missed_dispatch"],
    relatedKpiKeys: ["hs_technician_utilization", "hs_avg_response_time"],
    estimatedTimelineDays: 7,
  });

  decisionRegistry.register({
    key: "hs_increase_pricing",
    label: "Increase Service Pricing",
    description: "Adjust pricing to reflect material cost increases or demand surge.",
    category: "financial",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: [],
    relatedKpiKeys: ["hs_avg_ticket_value", "hs_gross_margin_per_job"],
    playbook: "hs_pricing_playbook",
    estimatedTimelineDays: 14,
  });

  decisionRegistry.register({
    key: "hs_prioritize_emergency",
    label: "Prioritize Emergency Jobs",
    description: "Reserve one technician slot per day for same-day emergency calls.",
    category: "operational",
    defaultSeverity: "high",
    approvalPolicy: "auto",
    relatedConstraintDefinitionKeys: ["hs_missed_dispatch"],
    relatedKpiKeys: ["hs_avg_response_time", "hs_customer_satisfaction"],
    estimatedTimelineDays: 3,
  });

  decisionRegistry.register({
    key: "hs_reorder_inventory",
    label: "Reorder Parts Inventory",
    description: "Replenish commonly used parts to prevent job delays and callbacks.",
    category: "operational",
    defaultSeverity: "medium",
    approvalPolicy: "auto",
    relatedConstraintDefinitionKeys: ["hs_callback_rate_high"],
    relatedKpiKeys: ["hs_first_time_fix_rate", "hs_callback_rate"],
    estimatedTimelineDays: 5,
  });

  decisionRegistry.register({
    key: "hs_promote_maintenance_plans",
    label: "Promote Maintenance Plans",
    description: "Run outreach campaign to convert one-time customers to annual maintenance agreements.",
    category: "marketing",
    defaultSeverity: "medium",
    approvalPolicy: "auto",
    relatedConstraintDefinitionKeys: ["hs_low_maintenance_renewal"],
    relatedKpiKeys: ["hs_maintenance_renewal_rate", "hs_revenue_per_technician"],
    playbook: "hs_maintenance_playbook",
    estimatedTimelineDays: 21,
  });

  decisionRegistry.register({
    key: "hs_follow_up_stale_estimates",
    label: "Follow Up on Stale Estimates",
    description: "Re-engage customers who received an estimate but haven't responded in 5+ days.",
    category: "customer",
    defaultSeverity: "medium",
    approvalPolicy: "auto",
    relatedConstraintDefinitionKeys: ["hs_low_estimate_acceptance"],
    relatedKpiKeys: ["hs_estimate_acceptance_rate"],
    estimatedTimelineDays: 2,
  });
}
