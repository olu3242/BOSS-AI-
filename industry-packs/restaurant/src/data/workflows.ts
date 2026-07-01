import { workflowRegistry } from "@boss/registries";

const workflows = [
  {
    key: "rest_reservation_management",
    label: "Reservation Management",
    description: "Accept, confirm, and manage dining reservations across phone, web, and third-party platforms.",
    triggerType: "event" as const,
    relatedConstraints: ["rest_low_reservation_fill"],
    relatedKpis: ["rest_reservation_fill_rate", "rest_no_show_rate"],
  },
  {
    key: "rest_reservation_confirmation",
    label: "Reservation Confirmation & Reminders",
    description: "Send automated reservation confirmations and 24-hour reminder messages to reduce no-shows.",
    triggerType: "schedule" as const,
    relatedConstraints: ["rest_high_no_show_rate"],
    relatedKpis: ["rest_no_show_rate"],
  },
  {
    key: "rest_table_management",
    label: "Table Management & Seating",
    description: "Assign and seat parties optimally to maximize table turn rate and minimize wait times.",
    triggerType: "event" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["rest_table_turn_rate", "rest_revpash"],
  },
  {
    key: "rest_order_taking",
    label: "Order Taking & POS Entry",
    description: "Capture guest orders accurately and transmit to kitchen, ensuring upsell prompts are offered.",
    triggerType: "event" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["rest_avg_check_size"],
  },
  {
    key: "rest_kitchen_ticket_management",
    label: "Kitchen Ticket Management",
    description: "Route and prioritize kitchen tickets to minimize ticket times and ensure food quality at the pass.",
    triggerType: "event" as const,
    relatedConstraints: ["rest_high_ticket_times"],
    relatedKpis: ["rest_table_turn_rate"],
  },
  {
    key: "rest_inventory_receiving",
    label: "Inventory Receiving & Logging",
    description: "Receive deliveries, verify against purchase orders, and log into inventory management system.",
    triggerType: "event" as const,
    relatedConstraints: ["rest_food_cost_high"],
    relatedKpis: ["rest_food_cost_pct", "rest_waste_pct"],
  },
  {
    key: "rest_waste_tracking",
    label: "Waste Tracking",
    description: "Log daily food waste by category to identify cost leak patterns and over-ordering.",
    triggerType: "schedule" as const,
    relatedConstraints: ["rest_food_cost_high"],
    relatedKpis: ["rest_waste_pct", "rest_food_cost_pct"],
  },
  {
    key: "rest_end_of_day_reconciliation",
    label: "End-of-Day Reconciliation",
    description: "Reconcile POS sales, cash, tips, and comps at the close of each service.",
    triggerType: "schedule" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["rest_prime_cost_pct", "rest_avg_check_size"],
  },
  {
    key: "rest_weekly_prime_cost_review",
    label: "Weekly Prime Cost Review",
    description: "Calculate and review food cost %, labor cost %, and prime cost % against targets each week.",
    triggerType: "schedule" as const,
    relatedConstraints: ["rest_food_cost_high", "rest_labor_cost_high"],
    relatedKpis: ["rest_prime_cost_pct", "rest_food_cost_pct", "rest_labor_cost_pct"],
  },
  {
    key: "rest_review_response",
    label: "Online Review Response",
    description: "Monitor and respond to new guest reviews on Google, Yelp, and TripAdvisor within 24 hours.",
    triggerType: "schedule" as const,
    relatedConstraints: ["rest_low_review_rating"],
    relatedKpis: ["rest_online_review_rating"],
  },
  {
    key: "rest_staff_scheduling",
    label: "Staff Scheduling",
    description: "Build and publish weekly labor schedules aligned to forecast demand to control labor cost %.",
    triggerType: "schedule" as const,
    relatedConstraints: ["rest_labor_cost_high"],
    relatedKpis: ["rest_labor_cost_pct", "rest_prime_cost_pct"],
  },
];

export function seedWorkflows(): void {
  for (const workflow of workflows) {
    workflowRegistry.register(workflow);
  }
}
