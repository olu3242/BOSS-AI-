import { forecastRegistry } from "@boss/registries";

export function seedForecasts(): void {
  forecastRegistry.register({
    key: "revenue_forecast",
    label: "Revenue Forecast",
    description: "Projects revenue growth based on health score, lead conversion, and historical trends.",
    domain: "revenue",
    periodOptions: ["30d", "90d", "180d", "365d"],
    primaryInputs: ["business_health_score", "lead_conversion_rate", "revenue"],
    confidenceRange: { min: 0.55, max: 0.85 },
    relatedKpiKeys: ["revenue", "lead_conversion_rate", "profit_margin"],
  });
  forecastRegistry.register({
    key: "cash_flow_forecast",
    label: "Cash Flow Forecast",
    description: "Projects net cash position based on outstanding invoices, expenses, and payment velocity.",
    domain: "cash_flow",
    periodOptions: ["30d", "90d"],
    primaryInputs: ["outstanding_invoices", "profit_margin"],
    confidenceRange: { min: 0.6, max: 0.8 },
    relatedKpiKeys: ["outstanding_invoices", "profit_margin"],
  });
  forecastRegistry.register({
    key: "churn_forecast",
    label: "Customer Churn Forecast",
    description: "Estimates customer loss rate based on retention score and engagement signals.",
    domain: "churn",
    periodOptions: ["30d", "90d", "180d"],
    primaryInputs: ["customer_retention", "review_rating"],
    confidenceRange: { min: 0.5, max: 0.75 },
    relatedKpiKeys: ["customer_retention", "review_rating"],
  });
  forecastRegistry.register({
    key: "growth_forecast",
    label: "Business Growth Forecast",
    description: "Projects composite business growth based on health trajectory and goal attainment.",
    domain: "growth",
    periodOptions: ["90d", "180d", "365d"],
    primaryInputs: ["business_health_score", "business_growth_score", "ai_adoption_score"],
    confidenceRange: { min: 0.45, max: 0.7 },
    relatedKpiKeys: ["business_health_score", "business_growth_score"],
  });
  forecastRegistry.register({
    key: "operational_capacity_forecast",
    label: "Operational Capacity Forecast",
    description: "Estimates capacity utilization and identifies bottlenecks under projected demand.",
    domain: "capacity",
    periodOptions: ["30d", "90d"],
    primaryInputs: ["administrative_hours", "business_health_score"],
    confidenceRange: { min: 0.55, max: 0.75 },
    relatedKpiKeys: ["administrative_hours"],
  });
}
