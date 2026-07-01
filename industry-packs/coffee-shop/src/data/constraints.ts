import { constraintRegistry } from "@boss/registries";

const constraints = [
  {
    key: "cafe_labor_cost_high",
    label: "Labor Cost Too High",
    description: "Labor cost exceeds 35% of revenue, compressing margins and indicating over-scheduling or low throughput per labor hour.",
    relatedCapabilities: ["staff_scheduling", "labor_management"],
  },
  {
    key: "cafe_beverage_waste_high",
    label: "Beverage Waste Too High",
    description: "Beverage waste exceeds 5% of purchases, indicating over-production, spoilage, or poor portion control.",
    relatedCapabilities: ["inventory_management", "waste_tracking"],
  },
  {
    key: "cafe_slow_drive_thru",
    label: "Drive-Thru Speed Below Target",
    description: "Drive-thru average speed exceeds 240 seconds, causing customer dissatisfaction and reducing throughput capacity.",
    relatedCapabilities: ["order_management", "workflow_optimization"],
  },
  {
    key: "cafe_low_loyalty_adoption",
    label: "Low Loyalty Program Adoption",
    description: "Fewer than 30% of transactions are made by loyalty members, limiting retention data and repeat visit incentives.",
    relatedCapabilities: ["customer_engagement", "loyalty_management"],
  },
  {
    key: "cafe_equipment_downtime",
    label: "Equipment Downtime",
    description: "Espresso machines, grinders, or brew equipment experiencing unplanned downtime, disrupting service and revenue.",
    relatedCapabilities: ["equipment_maintenance", "asset_management"],
  },
  {
    key: "cafe_supply_shortage",
    label: "Supply Shortage",
    description: "Critical ingredients are at risk of running out before the next scheduled delivery, threatening menu availability.",
    relatedCapabilities: ["procurement", "supplier_management"],
  },
  {
    key: "cafe_low_avg_ticket",
    label: "Average Ticket Size Below Target",
    description: "Average transaction value is below target, indicating missed upsell opportunities or an underperforming menu mix.",
    relatedCapabilities: ["upselling", "menu_optimization"],
  },
];

export function seedConstraints(): void {
  for (const constraint of constraints) {
    constraintRegistry.register(constraint);
  }
}
