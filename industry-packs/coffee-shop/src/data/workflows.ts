import { workflowRegistry } from "@boss/registries";

const workflows = [
  {
    key: "cafe_morning_opening",
    label: "Morning Opening",
    description: "Execute the daily opening checklist: equipment startup, inventory spot-check, staff briefing, and register reconciliation.",
    triggerType: "schedule" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["cafe_transactions_per_hour"],
  },
  {
    key: "cafe_order_taking",
    label: "Order Taking",
    description: "Capture and confirm customer orders accurately via POS — in-store, drive-thru, or digital channel.",
    triggerType: "event" as const,
    relatedConstraints: ["cafe_slow_drive_thru"],
    relatedKpis: ["cafe_avg_ticket_size", "cafe_transactions_per_hour"],
  },
  {
    key: "cafe_beverage_preparation",
    label: "Beverage Preparation",
    description: "Prepare beverages according to recipe standards and quality guidelines, tracking output speed and consistency.",
    triggerType: "event" as const,
    relatedConstraints: ["cafe_slow_drive_thru", "cafe_beverage_waste_high"],
    relatedKpis: ["cafe_drive_thru_speed_sec", "cafe_beverage_cost_pct"],
  },
  {
    key: "cafe_inventory_ordering",
    label: "Inventory Ordering",
    description: "Analyze current stock levels against par levels and generate purchase orders to prevent shortages.",
    triggerType: "schedule" as const,
    relatedConstraints: ["cafe_supply_shortage"],
    relatedKpis: ["cafe_waste_pct", "cafe_beverage_cost_pct"],
  },
  {
    key: "cafe_waste_tracking",
    label: "Waste Tracking",
    description: "Record and categorize all waste events — spoilage, overproduction, and spills — to identify reduction opportunities.",
    triggerType: "schedule" as const,
    relatedConstraints: ["cafe_beverage_waste_high"],
    relatedKpis: ["cafe_waste_pct", "cafe_beverage_cost_pct", "cafe_food_cost_pct"],
  },
  {
    key: "cafe_staff_scheduling",
    label: "Staff Scheduling",
    description: "Build and publish weekly staff schedules aligned with forecasted demand to optimize labor cost.",
    triggerType: "schedule" as const,
    relatedConstraints: ["cafe_labor_cost_high"],
    relatedKpis: ["cafe_labor_cost_pct", "cafe_transactions_per_hour"],
  },
  {
    key: "cafe_loyalty_enrollment",
    label: "Loyalty Enrollment",
    description: "Enroll customers in the loyalty program at point of sale and send welcome communications.",
    triggerType: "manual" as const,
    relatedConstraints: ["cafe_low_loyalty_adoption"],
    relatedKpis: ["cafe_loyalty_member_pct"],
  },
  {
    key: "cafe_equipment_cleaning",
    label: "Equipment Cleaning",
    description: "Execute scheduled deep-cleaning protocols for espresso machines, grinders, and brew equipment.",
    triggerType: "schedule" as const,
    relatedConstraints: ["cafe_equipment_downtime"],
    relatedKpis: ["cafe_beverage_cost_pct"],
  },
  {
    key: "cafe_daily_close",
    label: "Daily Close",
    description: "Complete end-of-day closing tasks: till reconciliation, waste log submission, equipment shutdown, and sales summary.",
    triggerType: "schedule" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["cafe_waste_pct", "cafe_revenue_per_sqft"],
  },
  {
    key: "cafe_online_order_fulfillment",
    label: "Online Order Fulfillment",
    description: "Receive, prioritize, and fulfill orders placed through mobile app or third-party delivery platforms.",
    triggerType: "event" as const,
    relatedConstraints: ["cafe_slow_drive_thru"],
    relatedKpis: ["cafe_avg_ticket_size", "cafe_transactions_per_hour"],
  },
  {
    key: "cafe_promotional_campaign",
    label: "Promotional Campaign",
    description: "Design, launch, and measure targeted promotional campaigns to drive traffic and increase average ticket size.",
    triggerType: "manual" as const,
    relatedConstraints: ["cafe_low_avg_ticket"],
    relatedKpis: ["cafe_avg_ticket_size", "cafe_loyalty_member_pct"],
  },
];

export function seedWorkflows(): void {
  for (const workflow of workflows) {
    workflowRegistry.register(workflow);
  }
}
