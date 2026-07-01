import { constraintRegistry } from "@boss/registries";

const constraints = [
  {
    key: "rest_food_cost_high",
    label: "Food Cost % Too High",
    description: "Food cost percentage exceeds 30%, directly compressing profit margins and threatening prime cost targets.",
    relatedCapabilities: ["food_cost_tracking", "inventory_management", "waste_reduction", "menu_engineering"],
  },
  {
    key: "rest_labor_cost_high",
    label: "Labor Cost % Too High",
    description: "Labor cost percentage exceeds 35%, indicating overstaffing, inefficient scheduling, or revenue underperformance.",
    relatedCapabilities: ["labor_scheduling", "demand_forecasting", "shift_optimization"],
  },
  {
    key: "rest_prime_cost_high",
    label: "Prime Cost % Too High",
    description: "Prime cost (food + labor) exceeds 65% of revenue, leaving insufficient margin to cover occupancy and operating expenses.",
    relatedCapabilities: ["food_cost_tracking", "labor_scheduling", "revenue_optimization"],
  },
  {
    key: "rest_high_no_show_rate",
    label: "High Reservation No-Show Rate",
    description: "Reservation no-show rate exceeds 5%, causing significant lost revenue from unoccupied tables that cannot be reseated.",
    relatedCapabilities: ["reservation_management", "no_show_prevention", "waitlist_management"],
  },
  {
    key: "rest_low_reservation_fill",
    label: "Low Reservation Fill Rate",
    description: "Reservation fill rate is below 80%, indicating underutilized dining room capacity and untapped RevPASH potential.",
    relatedCapabilities: ["reservation_management", "demand_marketing", "pricing_strategy"],
  },
  {
    key: "rest_low_review_rating",
    label: "Online Review Rating Below Target",
    description: "Average online rating is below 4.3 stars, suppressing new guest discovery and threatening reservation volume.",
    relatedCapabilities: ["guest_experience", "review_management", "service_recovery"],
  },
  {
    key: "rest_high_ticket_times",
    label: "High Kitchen Ticket Times",
    description: "Average ticket times are exceeding targets, slowing table turns and degrading the guest experience.",
    relatedCapabilities: ["kitchen_management", "order_routing", "staff_coordination"],
  },
];

export function seedConstraints(): void {
  for (const constraint of constraints) {
    constraintRegistry.register(constraint);
  }
}
