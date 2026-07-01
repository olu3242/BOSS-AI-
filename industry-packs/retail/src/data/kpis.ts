import { kpiRegistry } from "@boss/registries";

const kpis = [
  {
    key: "retail_gross_margin_pct",
    label: "Gross Margin %",
    description: "Revenue minus cost of goods sold as a percentage of revenue. The fundamental retail profitability metric.",
    formulaPlaceholder: "(revenue - cogs) / revenue",
    owner: "Finance",
    measurementFrequency: "monthly" as const,
    targetRange: "> 45%",
  },
  {
    key: "retail_inventory_turnover",
    label: "Inventory Turnover",
    description: "Number of times inventory is sold and replaced in a period. Low turnover indicates excess or slow-moving stock.",
    formulaPlaceholder: "cogs / avg_inventory_value",
    owner: "Operations",
    measurementFrequency: "monthly" as const,
    targetRange: "> 4x per year",
  },
  {
    key: "retail_sell_through_rate",
    label: "Sell-Through Rate",
    description: "Percentage of inventory received that was sold in a given period, before reordering.",
    formulaPlaceholder: "units_sold / units_received",
    owner: "Operations",
    measurementFrequency: "monthly" as const,
    targetRange: "> 80%",
  },
  {
    key: "retail_avg_transaction_value",
    label: "Average Transaction Value",
    description: "Average dollar value of each customer transaction at checkout.",
    formulaPlaceholder: "total_revenue / total_transactions",
    owner: "Sales",
    measurementFrequency: "weekly" as const,
    targetRange: "> $65 per transaction",
  },
  {
    key: "retail_units_per_transaction",
    label: "Units Per Transaction",
    description: "Average number of items purchased per customer visit. Measures cross-sell and basket-building effectiveness.",
    formulaPlaceholder: "total_units_sold / total_transactions",
    owner: "Sales",
    measurementFrequency: "weekly" as const,
    targetRange: "> 2.5 units",
  },
  {
    key: "retail_conversion_rate",
    label: "Store Conversion Rate",
    description: "Percentage of store visitors who make a purchase.",
    formulaPlaceholder: "transactions / foot_traffic",
    owner: "Sales",
    measurementFrequency: "weekly" as const,
    targetRange: "> 25%",
  },
  {
    key: "retail_sales_per_sqft",
    label: "Sales Per Square Foot",
    description: "Annual revenue generated per square foot of retail floor space. The industry standard space productivity metric.",
    formulaPlaceholder: "annual_revenue / total_sqft",
    owner: "Finance",
    measurementFrequency: "monthly" as const,
    targetRange: "> $300/sqft/year",
  },
  {
    key: "retail_shrinkage_rate",
    label: "Shrinkage Rate",
    description: "Inventory loss as a percentage of sales, due to theft, damage, administrative error, or vendor fraud.",
    formulaPlaceholder: "inventory_loss / total_sales",
    owner: "Operations",
    measurementFrequency: "monthly" as const,
    targetRange: "< 1.5%",
  },
  {
    key: "retail_customer_return_rate",
    label: "Customer Return Rate",
    description: "Percentage of customers who make more than one purchase within a 12-month period.",
    formulaPlaceholder: "repeat_customers / total_customers",
    owner: "Marketing",
    measurementFrequency: "monthly" as const,
    targetRange: "> 30%",
  },
  {
    key: "retail_stockout_rate",
    label: "Stockout Rate",
    description: "Percentage of SKUs that were out of stock at any point during a period. Lost sales indicator.",
    formulaPlaceholder: "sku_stockout_days / total_sku_days",
    owner: "Operations",
    measurementFrequency: "weekly" as const,
    targetRange: "< 2%",
  },
];

export function seedKpis(): void {
  for (const kpi of kpis) {
    kpiRegistry.register(kpi);
  }
}
