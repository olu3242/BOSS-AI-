import { kpiRegistry } from "@boss/registries";

const kpis = [
  {
    key: "cafe_avg_ticket_size",
    label: "Average Ticket Size",
    description: "Average dollar value per customer transaction.",
    formulaPlaceholder: "total_revenue / total_transactions",
    owner: "Finance",
    measurementFrequency: "daily" as const,
    targetRange: "> $8.00",
  },
  {
    key: "cafe_transactions_per_hour",
    label: "Transactions Per Hour",
    description: "Number of customer transactions processed per hour of operation.",
    formulaPlaceholder: "total_transactions / operating_hours",
    owner: "Operations",
    measurementFrequency: "daily" as const,
    targetRange: "> 30",
  },
  {
    key: "cafe_beverage_cost_pct",
    label: "Beverage Cost %",
    description: "Beverage ingredient cost as a percentage of beverage revenue.",
    formulaPlaceholder: "beverage_cogs / beverage_revenue",
    owner: "Finance",
    measurementFrequency: "weekly" as const,
    targetRange: "< 28%",
  },
  {
    key: "cafe_food_cost_pct",
    label: "Food Cost %",
    description: "Food ingredient cost as a percentage of food revenue.",
    formulaPlaceholder: "food_cogs / food_revenue",
    owner: "Finance",
    measurementFrequency: "weekly" as const,
    targetRange: "< 32%",
  },
  {
    key: "cafe_labor_cost_pct",
    label: "Labor Cost %",
    description: "Total labor cost as a percentage of total revenue.",
    formulaPlaceholder: "total_labor_cost / total_revenue",
    owner: "Finance",
    measurementFrequency: "weekly" as const,
    targetRange: "< 35%",
  },
  {
    key: "cafe_waste_pct",
    label: "Waste %",
    description: "Waste as a percentage of total purchases — measures spoilage and over-preparation.",
    formulaPlaceholder: "waste_value / total_purchases",
    owner: "Operations",
    measurementFrequency: "weekly" as const,
    targetRange: "< 5%",
  },
  {
    key: "cafe_loyalty_member_pct",
    label: "Loyalty Member %",
    description: "Percentage of transactions made by enrolled loyalty program members.",
    formulaPlaceholder: "loyalty_transactions / total_transactions",
    owner: "Marketing",
    measurementFrequency: "monthly" as const,
    targetRange: "> 40%",
  },
  {
    key: "cafe_drive_thru_speed_sec",
    label: "Drive-Thru Average Speed (sec)",
    description: "Average time in seconds from order placed to order fulfilled at the drive-thru window.",
    formulaPlaceholder: "sum(order_to_handoff_seconds) / drive_thru_transactions",
    owner: "Operations",
    measurementFrequency: "daily" as const,
    targetRange: "< 240 seconds",
  },
  {
    key: "cafe_online_review_rating",
    label: "Online Review Rating",
    description: "Average star rating across all major online review platforms (Google, Yelp, etc.).",
    formulaPlaceholder: "sum(review_scores) / total_reviews",
    owner: "Marketing",
    measurementFrequency: "monthly" as const,
    targetRange: "> 4.3 stars",
  },
  {
    key: "cafe_revenue_per_sqft",
    label: "Revenue Per Square Foot",
    description: "Monthly revenue divided by total square footage — measures space efficiency.",
    formulaPlaceholder: "monthly_revenue / total_sqft",
    owner: "Finance",
    measurementFrequency: "monthly" as const,
    targetRange: "> $50/sqft",
  },
];

export function seedKpis(): void {
  for (const kpi of kpis) {
    kpiRegistry.register(kpi);
  }
}
