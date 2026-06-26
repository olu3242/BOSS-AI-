import { kpiRegistry } from "@boss/registries";

const kpis = [
  { key: "lead_response_time", label: "Lead Response Time", description: "Time from lead creation to first contact.", formulaPlaceholder: "avg(first_contact_at - created_at)", owner: "Sales", measurementFrequency: "daily" as const, targetRange: "< 1 hour" },
  { key: "lead_conversion_rate", label: "Lead Conversion Rate", description: "Share of leads that become customers.", formulaPlaceholder: "converted_leads / total_leads", owner: "Sales", measurementFrequency: "weekly" as const, targetRange: "> 20%" },
  { key: "customer_retention", label: "Customer Retention", description: "Share of customers retained period over period.", formulaPlaceholder: "retained_customers / starting_customers", owner: "Customer Success", measurementFrequency: "monthly" as const, targetRange: "> 80%" },
  { key: "revenue", label: "Revenue", description: "Total revenue recognized in the period.", formulaPlaceholder: "sum(invoice.amount where paid)", owner: "Finance", measurementFrequency: "monthly" as const, targetRange: "trend up" },
  { key: "profit_margin", label: "Profit Margin", description: "Net profit as a share of revenue.", formulaPlaceholder: "(revenue - expenses) / revenue", owner: "Finance", measurementFrequency: "monthly" as const, targetRange: "> 15%" },
  { key: "outstanding_invoices", label: "Outstanding Invoices", description: "Total unpaid invoice value.", formulaPlaceholder: "sum(invoice.amount where status != paid)", owner: "Finance", measurementFrequency: "weekly" as const, targetRange: "< 10% of revenue" },
  { key: "administrative_hours", label: "Administrative Hours", description: "Owner/staff hours spent on admin tasks.", formulaPlaceholder: "sum(task.hours where category = admin)", owner: "Operations", measurementFrequency: "weekly" as const, targetRange: "trend down" },
  { key: "review_rating", label: "Review Rating", description: "Average customer review rating.", formulaPlaceholder: "avg(review.rating)", owner: "Marketing", measurementFrequency: "monthly" as const, targetRange: "> 4.5" },
  { key: "business_health_score", label: "Business Health Score", description: "Composite score across all health dimensions.", formulaPlaceholder: "weighted_avg(health_dimensions)", owner: "Owner", measurementFrequency: "daily" as const, targetRange: "trend up" },
  { key: "business_growth_score", label: "Business Growth Score", description: "Composite score of growth-related KPIs.", formulaPlaceholder: "weighted_avg(growth_kpis)", owner: "Owner", measurementFrequency: "monthly" as const, targetRange: "trend up" },
  { key: "ai_adoption_score", label: "AI Adoption Score", description: "Share of available AI employees/workflows actively in use.", formulaPlaceholder: "active_ai_capabilities / available_ai_capabilities", owner: "Owner", measurementFrequency: "monthly" as const, targetRange: "trend up" },
];

export function seedKpis(): void {
  for (const kpi of kpis) {
    kpiRegistry.register(kpi);
  }
}
