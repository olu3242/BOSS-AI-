import { workflowRegistry } from "@boss/registries";

const workflows = [
  {
    key: "retail_purchase_order_management",
    label: "Purchase Order Management",
    description: "Create, submit, and track purchase orders to replenish inventory based on par levels and sales velocity.",
    triggerType: "schedule" as const,
    relatedConstraints: ["retail_stockout_risk"],
    relatedKpis: ["retail_inventory_turnover", "retail_stockout_rate"],
  },
  {
    key: "retail_receiving_and_putaway",
    label: "Receiving & Putaway",
    description: "Receive vendor deliveries, verify against POs, check for damage, and stock merchandise to floor or backroom.",
    triggerType: "event" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["retail_sell_through_rate", "retail_shrinkage_rate"],
  },
  {
    key: "retail_inventory_count",
    label: "Inventory Count & Reconciliation",
    description: "Conduct periodic cycle counts and annual physical inventory to reconcile on-hand quantities and detect shrinkage.",
    triggerType: "schedule" as const,
    relatedConstraints: ["retail_high_shrinkage"],
    relatedKpis: ["retail_shrinkage_rate", "retail_inventory_turnover"],
  },
  {
    key: "retail_floor_merchandising",
    label: "Floor Merchandising & Display",
    description: "Set up, maintain, and refresh floor displays, endcaps, and promotional areas to maximize conversion.",
    triggerType: "manual" as const,
    relatedConstraints: ["retail_low_conversion"],
    relatedKpis: ["retail_conversion_rate", "retail_sales_per_sqft"],
  },
  {
    key: "retail_customer_checkout",
    label: "Customer Checkout",
    description: "Process transactions accurately and efficiently, prompting for add-on items and loyalty program enrollment.",
    triggerType: "event" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["retail_avg_transaction_value", "retail_units_per_transaction"],
  },
  {
    key: "retail_returns_processing",
    label: "Returns & Exchanges",
    description: "Process customer returns, exchanges, and credits per store policy, and restock or disposition returned merchandise.",
    triggerType: "event" as const,
    relatedConstraints: ["retail_high_return_rate"],
    relatedKpis: ["retail_gross_margin_pct"],
  },
  {
    key: "retail_markdown_management",
    label: "Markdown & Clearance Management",
    description: "Identify slow-moving and aging inventory and execute systematic markdown cadence to clear stock.",
    triggerType: "schedule" as const,
    relatedConstraints: ["retail_slow_moving_inventory"],
    relatedKpis: ["retail_sell_through_rate", "retail_inventory_turnover"],
  },
  {
    key: "retail_loyalty_enrollment",
    label: "Loyalty Program Enrollment",
    description: "Enroll new customers in the loyalty program at checkout and activate email/SMS marketing opt-ins.",
    triggerType: "event" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["retail_customer_return_rate"],
  },
  {
    key: "retail_promotional_campaign",
    label: "Promotional Campaign Execution",
    description: "Execute in-store and digital promotions: pricing updates, signage, email blasts, and social media.",
    triggerType: "manual" as const,
    relatedConstraints: ["retail_low_conversion"],
    relatedKpis: ["retail_conversion_rate", "retail_avg_transaction_value"],
  },
  {
    key: "retail_daily_sales_reconciliation",
    label: "Daily Sales Reconciliation",
    description: "Close out registers, reconcile cash and card totals, and submit daily sales report.",
    triggerType: "schedule" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["retail_gross_margin_pct", "retail_avg_transaction_value"],
  },
  {
    key: "retail_vendor_performance_review",
    label: "Vendor Performance Review",
    description: "Evaluate vendor fill rates, lead times, quality, and pricing quarterly to optimize the supplier base.",
    triggerType: "schedule" as const,
    relatedConstraints: ["retail_stockout_risk"],
    relatedKpis: ["retail_inventory_turnover", "retail_stockout_rate", "retail_gross_margin_pct"],
  },
];

export function seedWorkflows(): void {
  for (const workflow of workflows) {
    workflowRegistry.register(workflow);
  }
}
