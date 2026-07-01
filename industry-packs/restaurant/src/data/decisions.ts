import { decisionRegistry } from "@boss/registries";

export function seedDecisions(): void {
  decisionRegistry.register({
    key: "rest_reduce_food_cost",
    label: "Reduce Food Cost %",
    description: "Address food cost exceeding 30% through menu engineering, supplier renegotiation, portion control, and waste reduction.",
    category: "financial",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["rest_food_cost_high"],
    relatedKpiKeys: ["rest_food_cost_pct", "rest_prime_cost_pct", "rest_waste_pct"],
    playbook: "rest_food_cost_playbook",
    estimatedTimelineDays: 30,
  });

  decisionRegistry.register({
    key: "rest_reduce_labor_cost",
    label: "Reduce Labor Cost %",
    description: "Bring labor cost below 35% by optimizing shift scheduling, cross-training staff, and aligning labor to forecasted covers.",
    category: "financial",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["rest_labor_cost_high"],
    relatedKpiKeys: ["rest_labor_cost_pct", "rest_prime_cost_pct"],
    playbook: "rest_labor_optimization_playbook",
    estimatedTimelineDays: 21,
  });

  decisionRegistry.register({
    key: "rest_increase_avg_check",
    label: "Increase Average Check Size",
    description: "Grow revenue per cover through upsell training, menu positioning, beverage program enhancement, and suggestive selling scripts.",
    category: "customer",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: [] as string[],
    relatedKpiKeys: ["rest_avg_check_size", "rest_revpash"],
    estimatedTimelineDays: 14,
  });

  decisionRegistry.register({
    key: "rest_fill_reservation_gaps",
    label: "Fill Reservation Gaps",
    description: "Activate walk-in strategy, reduce cancellation windows, and market open slots on social and reservation platforms.",
    category: "operational",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["rest_low_reservation_fill"],
    relatedKpiKeys: ["rest_reservation_fill_rate", "rest_revpash"],
    estimatedTimelineDays: 7,
  });

  decisionRegistry.register({
    key: "rest_reduce_no_shows",
    label: "Reduce Reservation No-Shows",
    description: "Implement credit card holds, confirmation sequences, and cancellation waitlists to protect booked covers.",
    category: "operational",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["rest_high_no_show_rate"],
    relatedKpiKeys: ["rest_no_show_rate", "rest_reservation_fill_rate"],
    estimatedTimelineDays: 7,
  });

  decisionRegistry.register({
    key: "rest_improve_table_turns",
    label: "Improve Table Turn Rate",
    description: "Reduce friction in the dining experience: faster ticket times, proactive check delivery, and optimized seating assignments.",
    category: "operational",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["rest_high_ticket_times"],
    relatedKpiKeys: ["rest_table_turn_rate", "rest_revpash"],
    estimatedTimelineDays: 14,
  });

  decisionRegistry.register({
    key: "rest_reduce_waste",
    label: "Reduce Food Waste",
    description: "Audit over-ordering patterns, right-size prep volumes, and implement daily waste logging to eliminate cost leakage.",
    category: "operational",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["rest_food_cost_high"],
    relatedKpiKeys: ["rest_waste_pct", "rest_food_cost_pct"],
    playbook: "rest_food_cost_playbook",
    estimatedTimelineDays: 14,
  });

  decisionRegistry.register({
    key: "rest_improve_reviews",
    label: "Improve Online Review Rating",
    description: "Systematically request reviews from satisfied guests, respond to all reviews promptly, and address service failures proactively.",
    category: "marketing",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["rest_low_review_rating"],
    relatedKpiKeys: ["rest_online_review_rating"],
    estimatedTimelineDays: 30,
  });
}
