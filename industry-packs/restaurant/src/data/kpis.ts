import { kpiRegistry } from "@boss/registries";

const kpis = [
  {
    key: "rest_food_cost_pct",
    label: "Food Cost %",
    description: "Cost of goods sold as a percentage of food revenue. The single most critical restaurant cost control metric.",
    formulaPlaceholder: "food_cogs / food_revenue",
    owner: "Finance",
    measurementFrequency: "weekly" as const,
    targetRange: "< 30%",
  },
  {
    key: "rest_labor_cost_pct",
    label: "Labor Cost %",
    description: "Total labor costs (FOH + BOH) as a percentage of total revenue.",
    formulaPlaceholder: "total_labor / total_revenue",
    owner: "Finance",
    measurementFrequency: "weekly" as const,
    targetRange: "< 35%",
  },
  {
    key: "rest_prime_cost_pct",
    label: "Prime Cost %",
    description: "Combined food cost and labor cost as a percentage of revenue. The gold standard restaurant profitability metric.",
    formulaPlaceholder: "(food_cogs + total_labor) / total_revenue",
    owner: "Finance",
    measurementFrequency: "weekly" as const,
    targetRange: "< 60%",
  },
  {
    key: "rest_avg_check_size",
    label: "Average Check Size",
    description: "Average revenue generated per dining party per visit.",
    formulaPlaceholder: "total_revenue / total_covers",
    owner: "Sales",
    measurementFrequency: "daily" as const,
    targetRange: "> $45 per cover",
  },
  {
    key: "rest_table_turn_rate",
    label: "Table Turn Rate",
    description: "Number of times a table is seated and turned per service period.",
    formulaPlaceholder: "total_covers / total_tables",
    owner: "Operations",
    measurementFrequency: "daily" as const,
    targetRange: "> 2.5 turns per service",
  },
  {
    key: "rest_revpash",
    label: "RevPASH",
    description: "Revenue Per Available Seat Hour — the most complete measure of dining room productivity.",
    formulaPlaceholder: "total_revenue / (seats * hours_open)",
    owner: "Finance",
    measurementFrequency: "weekly" as const,
    targetRange: "> $15/seat/hour",
  },
  {
    key: "rest_reservation_fill_rate",
    label: "Reservation Fill Rate",
    description: "Percentage of available reservation slots that are booked for a given service.",
    formulaPlaceholder: "booked_reservations / available_reservation_slots",
    owner: "Operations",
    measurementFrequency: "daily" as const,
    targetRange: "> 80%",
  },
  {
    key: "rest_no_show_rate",
    label: "Reservation No-Show Rate",
    description: "Percentage of reservations where the party does not arrive and does not cancel.",
    formulaPlaceholder: "no_shows / total_reservations",
    owner: "Operations",
    measurementFrequency: "weekly" as const,
    targetRange: "< 5%",
  },
  {
    key: "rest_waste_pct",
    label: "Food Waste %",
    description: "Value of food discarded or comped as a percentage of total food purchased.",
    formulaPlaceholder: "waste_value / total_food_purchased",
    owner: "Operations",
    measurementFrequency: "weekly" as const,
    targetRange: "< 5%",
  },
  {
    key: "rest_online_review_rating",
    label: "Online Review Rating",
    description: "Average star rating across Google, Yelp, and TripAdvisor.",
    formulaPlaceholder: "avg(google_rating, yelp_rating, tripadvisor_rating)",
    owner: "Marketing",
    measurementFrequency: "monthly" as const,
    targetRange: "> 4.3 stars",
  },
];

export function seedKpis(): void {
  for (const kpi of kpis) {
    kpiRegistry.register(kpi);
  }
}
