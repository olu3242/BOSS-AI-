import { decisionRegistry } from "@boss/registries";

export function seedDecisions(): void {
  decisionRegistry.register({
    key: "retail_clear_slow_moving_inventory",
    label: "Clear Slow-Moving Inventory",
    description: "Identify SKUs with sell-through below 50% and initiate a markdown cadence to recover capital and free shelf space.",
    category: "operational",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["retail_slow_moving_inventory"],
    relatedKpiKeys: ["retail_sell_through_rate", "retail_inventory_turnover"],
    playbook: "retail_inventory_clearance_playbook",
    estimatedTimelineDays: 30,
  });

  decisionRegistry.register({
    key: "retail_increase_avg_transaction",
    label: "Increase Average Transaction Value",
    description: "Train staff on suggestive selling, restructure product placement, and introduce bundling to grow basket size.",
    category: "customer",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["retail_low_conversion"],
    relatedKpiKeys: ["retail_avg_transaction_value", "retail_units_per_transaction"],
    estimatedTimelineDays: 21,
  });

  decisionRegistry.register({
    key: "retail_reduce_shrinkage",
    label: "Reduce Shrinkage",
    description: "Audit loss prevention controls, improve receiving procedures, and implement cycle counts to bring shrinkage below 1.5%.",
    category: "operational",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["retail_high_shrinkage"],
    relatedKpiKeys: ["retail_shrinkage_rate", "retail_gross_margin_pct"],
    playbook: "retail_shrinkage_reduction_playbook",
    estimatedTimelineDays: 30,
  });

  decisionRegistry.register({
    key: "retail_improve_conversion_rate",
    label: "Improve Store Conversion Rate",
    description: "Refresh floor merchandising, enhance staff greeting and engagement protocols, and test promotional offers to drive purchases.",
    category: "customer",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["retail_low_conversion"],
    relatedKpiKeys: ["retail_conversion_rate", "retail_sales_per_sqft"],
    estimatedTimelineDays: 14,
  });

  decisionRegistry.register({
    key: "retail_optimize_inventory_levels",
    label: "Optimize Inventory Levels",
    description: "Right-size safety stock and reorder points to reduce stockouts and overstock simultaneously.",
    category: "operational",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["retail_stockout_risk"],
    relatedKpiKeys: ["retail_stockout_rate", "retail_inventory_turnover"],
    estimatedTimelineDays: 21,
  });

  decisionRegistry.register({
    key: "retail_improve_gross_margin",
    label: "Improve Gross Margin %",
    description: "Renegotiate vendor costs, shift product mix toward higher-margin categories, and reduce markdowns and returns.",
    category: "financial",
    defaultSeverity: "high",
    approvalPolicy: "executive_team",
    relatedConstraintDefinitionKeys: ["retail_margin_compression"],
    relatedKpiKeys: ["retail_gross_margin_pct", "retail_sales_per_sqft"],
    estimatedTimelineDays: 45,
  });

  decisionRegistry.register({
    key: "retail_grow_repeat_customers",
    label: "Grow Repeat Customer Rate",
    description: "Activate loyalty program, increase post-purchase email engagement, and create VIP customer events to drive return visits.",
    category: "marketing",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: [] as string[],
    relatedKpiKeys: ["retail_customer_return_rate", "retail_avg_transaction_value"],
    estimatedTimelineDays: 60,
  });

  decisionRegistry.register({
    key: "retail_expand_space_productivity",
    label: "Expand Space Productivity",
    description: "Audit underperforming floor areas, test new layouts and fixture arrangements to improve sales per square foot.",
    category: "operational",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: [] as string[],
    relatedKpiKeys: ["retail_sales_per_sqft", "retail_conversion_rate"],
    estimatedTimelineDays: 30,
  });
}
