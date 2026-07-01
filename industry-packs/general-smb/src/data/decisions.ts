import { decisionRegistry } from "@boss/registries";

export function seedDecisions(): void {
  decisionRegistry.register({
    key: "improve_sales_conversion",
    label: "Improve Sales Conversion",
    description: "Implement structured follow-up automation to increase lead-to-customer conversion rate.",
    category: "strategic",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["slow_lead_response", "manual_follow_up"],
    relatedKpiKeys: ["lead_conversion_rate", "lead_response_time"],
    playbook: "sales_conversion_playbook",
    estimatedTimelineDays: 30,
  });
  decisionRegistry.register({
    key: "reduce_admin_overhead",
    label: "Reduce Administrative Overhead",
    description: "Automate scheduling, invoicing, and routine communications to free owner time.",
    category: "operational",
    defaultSeverity: "medium",
    approvalPolicy: "auto",
    relatedConstraintDefinitionKeys: ["high_admin_burden"],
    relatedKpiKeys: ["administrative_hours", "business_health_score"],
    playbook: "operations_automation_playbook",
    estimatedTimelineDays: 14,
  });
  decisionRegistry.register({
    key: "improve_cash_flow",
    label: "Improve Cash Flow",
    description: "Implement automated invoice follow-up and payment reminders to reduce outstanding balances.",
    category: "financial",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["cash_flow_pressure", "high_outstanding_invoices"],
    relatedKpiKeys: ["outstanding_invoices", "profit_margin", "revenue"],
    estimatedTimelineDays: 21,
  });
  decisionRegistry.register({
    key: "improve_customer_retention",
    label: "Improve Customer Retention",
    description: "Launch re-engagement campaigns and loyalty programs for at-risk customers.",
    category: "customer",
    defaultSeverity: "high",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["customer_churn_risk"],
    relatedKpiKeys: ["customer_retention", "review_rating"],
    estimatedTimelineDays: 45,
  });
  decisionRegistry.register({
    key: "invest_in_marketing",
    label: "Invest in Marketing",
    description: "Allocate budget to digital marketing channels to grow lead pipeline.",
    category: "marketing",
    defaultSeverity: "medium",
    approvalPolicy: "owner",
    relatedConstraintDefinitionKeys: ["low_lead_volume"],
    relatedKpiKeys: ["lead_conversion_rate", "revenue"],
    estimatedTimelineDays: 60,
  });
}
