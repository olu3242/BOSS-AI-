import { decisionRegistry } from "@boss/registries";

export function seedDecisions(): void {
  decisionRegistry.register({
    key: "cafe_extend_hours",
    label: "Extend Operating Hours",
    description: "Evaluate adding early morning, evening, or weekend hours to capture more customer traffic and increase revenue per square foot.",
    category: "operational",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["cafe_low_avg_ticket"],
    relatedKpiKeys: ["cafe_transactions_per_hour", "cafe_revenue_per_sqft"],
    estimatedTimelineDays: 14,
  });

  decisionRegistry.register({
    key: "cafe_add_menu_item",
    label: "Add Menu Item",
    description: "Introduce a new beverage, food item, or seasonal offering to attract new customers and increase average ticket size.",
    category: "strategic",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["cafe_low_avg_ticket"],
    relatedKpiKeys: ["cafe_avg_ticket_size", "cafe_revenue_per_sqft"],
    playbook: "cafe_ticket_size_playbook",
    estimatedTimelineDays: 21,
  });

  decisionRegistry.register({
    key: "cafe_raise_prices",
    label: "Raise Menu Prices",
    description: "Adjust pricing to improve margins in response to rising ingredient or labor costs while monitoring customer impact.",
    category: "financial",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["cafe_labor_cost_high", "cafe_beverage_waste_high"],
    relatedKpiKeys: ["cafe_avg_ticket_size", "cafe_beverage_cost_pct", "cafe_food_cost_pct"],
    estimatedTimelineDays: 7,
  });

  decisionRegistry.register({
    key: "cafe_hire_barista",
    label: "Hire Additional Barista",
    description: "Bring on a new barista to reduce drive-thru wait times, improve throughput during peak hours, and relieve staff pressure.",
    category: "people",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["cafe_slow_drive_thru", "cafe_labor_cost_high"],
    relatedKpiKeys: ["cafe_drive_thru_speed_sec", "cafe_transactions_per_hour", "cafe_labor_cost_pct"],
    estimatedTimelineDays: 30,
  });

  decisionRegistry.register({
    key: "cafe_launch_loyalty_program",
    label: "Launch Loyalty Program",
    description: "Implement or upgrade a customer loyalty program to increase visit frequency and capture more revenue from returning customers.",
    category: "marketing",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["cafe_low_loyalty_adoption"],
    relatedKpiKeys: ["cafe_loyalty_member_pct", "cafe_avg_ticket_size"],
    playbook: "cafe_loyalty_growth_playbook",
    estimatedTimelineDays: 30,
  });

  decisionRegistry.register({
    key: "cafe_add_drive_thru",
    label: "Add Drive-Thru Lane",
    description: "Invest in drive-thru infrastructure to capture commuter traffic and increase throughput without adding square footage.",
    category: "strategic",
    defaultSeverity: "high",
    approvalPolicy: "executive_team",
    relatedConstraintDefinitionKeys: ["cafe_slow_drive_thru"],
    relatedKpiKeys: ["cafe_drive_thru_speed_sec", "cafe_transactions_per_hour", "cafe_revenue_per_sqft"],
    estimatedTimelineDays: 180,
  });

  decisionRegistry.register({
    key: "cafe_reduce_waste",
    label: "Reduce Waste",
    description: "Implement prep batching, better demand forecasting, and portion controls to bring waste percentage below target.",
    category: "operational",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["cafe_beverage_waste_high"],
    relatedKpiKeys: ["cafe_waste_pct", "cafe_beverage_cost_pct", "cafe_food_cost_pct"],
    playbook: "cafe_waste_reduction_playbook",
    estimatedTimelineDays: 14,
  });

  decisionRegistry.register({
    key: "cafe_partner_with_delivery_app",
    label: "Partner with Delivery App",
    description: "List the café on a third-party delivery platform to reach new customers and add an online revenue channel.",
    category: "marketing",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["cafe_low_avg_ticket"],
    relatedKpiKeys: ["cafe_avg_ticket_size", "cafe_transactions_per_hour", "cafe_online_review_rating"],
    estimatedTimelineDays: 21,
  });
}
