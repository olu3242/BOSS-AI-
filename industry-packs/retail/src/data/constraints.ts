import { constraintRegistry } from "@boss/registries";

const constraints = [
  {
    key: "retail_slow_moving_inventory",
    label: "Slow-Moving Inventory",
    description: "Sell-through rate below 50% for SKUs more than 60 days old, indicating capital is trapped in unsellable stock.",
    relatedCapabilities: ["inventory_management", "markdown_management", "category_planning"],
  },
  {
    key: "retail_high_shrinkage",
    label: "High Shrinkage Rate",
    description: "Shrinkage rate exceeds 1.5% of sales, indicating elevated theft, damage, or administrative error.",
    relatedCapabilities: ["loss_prevention", "inventory_counting", "receiving_verification"],
  },
  {
    key: "retail_low_conversion",
    label: "Low Store Conversion Rate",
    description: "Fewer than 25% of store visitors are making a purchase, indicating merchandising, pricing, or staff engagement issues.",
    relatedCapabilities: ["floor_merchandising", "customer_engagement", "pricing_strategy"],
  },
  {
    key: "retail_stockout_risk",
    label: "Stockout Risk",
    description: "Stockout rate exceeds 2% of SKUs, meaning customers are encountering out-of-stock items and walking away empty-handed.",
    relatedCapabilities: ["inventory_management", "purchase_order_management", "demand_forecasting"],
  },
  {
    key: "retail_margin_compression",
    label: "Gross Margin Compression",
    description: "Gross margin % is below 45%, indicating pricing pressure, unfavorable product mix, or excess markdowns and returns.",
    relatedCapabilities: ["pricing_management", "vendor_negotiation", "product_mix_optimization"],
  },
  {
    key: "retail_low_inventory_turns",
    label: "Low Inventory Turnover",
    description: "Inventory turns below 4x per year, indicating excess stock, poor purchasing discipline, or weak sell-through.",
    relatedCapabilities: ["inventory_management", "markdown_management", "demand_forecasting"],
  },
  {
    key: "retail_high_return_rate",
    label: "High Return Rate",
    description: "Customer return rate is elevated, eroding net revenue and suggesting product quality, fit, or expectation mismatches.",
    relatedCapabilities: ["product_quality_review", "customer_education", "returns_processing"],
  },
];

export function seedConstraints(): void {
  for (const constraint of constraints) {
    constraintRegistry.register(constraint);
  }
}
