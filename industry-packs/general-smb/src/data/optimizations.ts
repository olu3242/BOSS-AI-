import { optimizationRegistry } from "@boss/registries";

export function seedOptimizations(): void {
  optimizationRegistry.register({
    key: "automate_lead_follow_up",
    label: "Automate Lead Follow-Up",
    description: "Replace manual lead follow-up with automated email/SMS sequences to reduce response time and increase conversion.",
    domain: "automation",
    detectionCondition: "lead_response_time > 24h OR lead_conversion_rate < 0.15",
    recommendedAction: "Enable automated lead nurture workflow via CRM integration.",
    estimatedImpactPct: 25,
    relatedKpiKeys: ["lead_response_time", "lead_conversion_rate", "revenue"],
    priority: "high",
  });

  optimizationRegistry.register({
    key: "reduce_no_show_rate",
    label: "Reduce Appointment No-Show Rate",
    description: "Implement automated reminder sequences to reduce appointment no-shows and recover lost revenue.",
    domain: "revenue_growth",
    detectionCondition: "appointment_no_show_rate > 0.15",
    recommendedAction: "Deploy 48h + 24h + 2h automated reminder workflow with confirmation CTA.",
    estimatedImpactPct: 40,
    relatedKpiKeys: ["appointment_no_show_rate", "revenue", "capacity_utilization"],
    priority: "high",
  });

  optimizationRegistry.register({
    key: "streamline_invoicing",
    label: "Streamline Invoicing & Collections",
    description: "Automate invoice generation and payment reminders to reduce days-outstanding and improve cash flow.",
    domain: "workflow_efficiency",
    detectionCondition: "invoice_collection_days > 30 OR outstanding_receivables > monthly_revenue * 0.5",
    recommendedAction: "Enable auto-invoicing upon job completion and 7/14/30-day payment reminder sequences.",
    estimatedImpactPct: 30,
    relatedKpiKeys: ["invoice_collection_days", "cash_flow", "revenue"],
    priority: "medium",
  });

  optimizationRegistry.register({
    key: "optimize_staff_scheduling",
    label: "Optimize Staff Scheduling",
    description: "Use demand forecasting to align staff hours with peak business periods, reducing overtime and idle time.",
    domain: "resource_allocation",
    detectionCondition: "labor_cost_pct > 0.35 OR overtime_hours > 10_per_week",
    recommendedAction: "Implement demand-driven scheduling using historical booking patterns.",
    estimatedImpactPct: 15,
    relatedKpiKeys: ["labor_cost_pct", "capacity_utilization", "profit_margin"],
    priority: "medium",
  });

  optimizationRegistry.register({
    key: "upsell_existing_customers",
    label: "Upsell Existing Customer Base",
    description: "Target existing customers with relevant upsell offers based on purchase history and service gaps.",
    domain: "revenue_growth",
    detectionCondition: "average_transaction_value < industry_benchmark OR repeat_purchase_rate < 0.30",
    recommendedAction: "Launch targeted upsell campaign to customers with 60+ days since last purchase.",
    estimatedImpactPct: 20,
    relatedKpiKeys: ["average_transaction_value", "repeat_purchase_rate", "revenue"],
    priority: "medium",
  });

  optimizationRegistry.register({
    key: "reduce_customer_churn",
    label: "Proactive Churn Prevention",
    description: "Identify at-risk customers early and engage with retention offers before they churn.",
    domain: "customer_retention",
    detectionCondition: "customer_churn_rate > 0.05 OR nps_score < 30",
    recommendedAction: "Deploy churn prediction model and trigger retention workflow for high-risk accounts.",
    estimatedImpactPct: 35,
    relatedKpiKeys: ["customer_churn_rate", "customer_lifetime_value", "revenue"],
    priority: "high",
  });

  optimizationRegistry.register({
    key: "automate_expense_tracking",
    label: "Automate Expense Tracking",
    description: "Replace manual expense entry with automated capture to reduce bookkeeping time and errors.",
    domain: "cost_reduction",
    detectionCondition: "bookkeeping_hours_per_week > 5 OR expense_error_rate > 0.05",
    recommendedAction: "Integrate automated expense capture with bank feeds and receipt scanning.",
    estimatedImpactPct: 60,
    relatedKpiKeys: ["bookkeeping_hours", "operational_cost", "profit_margin"],
    priority: "low",
  });
}
