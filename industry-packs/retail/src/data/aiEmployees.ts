import { aiEmployeeRegistry } from "@boss/registries";

const aiEmployees = [
  {
    key: "retail_store_manager",
    label: "Store Manager",
    mission: "Own the store's commercial performance: sales, margin, inventory health, and team productivity.",
    responsibilities: [
      "Review daily sales against budget and prior year",
      "Monitor gross margin % and inventory turnover monthly",
      "Set weekly sell-through targets by category",
      "Manage staff scheduling to demand forecast",
    ],
    capabilities: [
      "Sales performance analysis",
      "Gross margin monitoring",
      "Inventory health reporting",
      "Labor planning",
    ],
    requiredTools: ["pos_dashboard", "inventory_system", "labor_scheduler"],
    kpis: ["retail_gross_margin_pct", "retail_sales_per_sqft", "retail_conversion_rate"],
    permissions: ["read:financials", "read:inventory", "write:alerts"],
    escalationRules: ["Escalate to owner if gross margin % drops below 40% for two consecutive months"],
    lifecycle: "available" as const,
  },
  {
    key: "retail_inventory_manager",
    label: "Inventory Manager",
    mission: "Maintain optimal inventory levels — enough to never stockout, not so much that capital is trapped.",
    responsibilities: [
      "Monitor sell-through rates and reorder points weekly",
      "Execute cycle counts on a rotating schedule",
      "Identify and escalate slow-moving SKUs for markdown",
      "Manage vendor relationships and purchase order accuracy",
    ],
    capabilities: [
      "Sell-through analysis",
      "Reorder point optimization",
      "Cycle count management",
      "Purchase order tracking",
    ],
    requiredTools: ["inventory_system", "purchase_order_tool", "cycle_count_app"],
    kpis: ["retail_inventory_turnover", "retail_sell_through_rate", "retail_stockout_rate", "retail_shrinkage_rate"],
    permissions: ["read:inventory", "write:orders", "write:counts"],
    escalationRules: ["Escalate SKUs with 0 sell-through over 60 days to Store Manager for markdown decision"],
    lifecycle: "available" as const,
  },
  {
    key: "retail_sales_floor_lead",
    label: "Sales Floor Lead",
    mission: "Convert foot traffic into revenue by maintaining a compelling floor environment and coaching team on selling skills.",
    responsibilities: [
      "Monitor and improve store conversion rate during shifts",
      "Coach associates on product knowledge and suggestive selling",
      "Maintain floor standards, signage, and display freshness",
      "Greet and engage all customers within 30 seconds of entry",
    ],
    capabilities: [
      "Conversion rate monitoring",
      "Associate coaching",
      "Merchandising execution",
      "Customer engagement",
    ],
    requiredTools: ["foot_traffic_counter", "pos_dashboard", "task_manager"],
    kpis: ["retail_conversion_rate", "retail_avg_transaction_value", "retail_units_per_transaction"],
    permissions: ["read:sales_metrics", "write:task_completions"],
    escalationRules: ["Escalate conversion rate below 15% during peak hours to Store Manager"],
    lifecycle: "available" as const,
  },
  {
    key: "retail_loss_prevention_coordinator",
    label: "Loss Prevention Coordinator",
    mission: "Protect store profitability by detecting and reducing shrinkage from all sources: theft, damage, and administrative error.",
    responsibilities: [
      "Conduct regular shrinkage audits and cycle counts",
      "Review exception reports from POS for suspicious activity",
      "Train staff on loss prevention protocols and awareness",
      "Investigate inventory discrepancies exceeding threshold",
    ],
    capabilities: [
      "Shrinkage tracking and analysis",
      "Exception reporting review",
      "Audit coordination",
      "Staff training",
    ],
    requiredTools: ["inventory_system", "pos_exception_reporter", "audit_tool"],
    kpis: ["retail_shrinkage_rate", "retail_gross_margin_pct"],
    permissions: ["read:inventory", "read:pos_exceptions", "write:audit_reports"],
    escalationRules: ["Escalate shrinkage incidents over $200 to Store Manager immediately"],
    lifecycle: "available" as const,
  },
  {
    key: "retail_customer_experience_manager",
    label: "Customer Experience Manager",
    mission: "Build loyal, returning customers through outstanding service, smooth returns processing, and a compelling loyalty program.",
    responsibilities: [
      "Drive loyalty program enrollment at checkout",
      "Handle escalated customer complaints and returns",
      "Monitor customer return rate and identify churn signals",
      "Execute post-purchase email and SMS follow-up campaigns",
    ],
    capabilities: [
      "Loyalty program management",
      "Customer retention analysis",
      "Complaint resolution",
      "Follow-up campaign execution",
    ],
    requiredTools: ["crm_system", "pos_dashboard", "email_sms_sender"],
    kpis: ["retail_customer_return_rate", "retail_avg_transaction_value"],
    permissions: ["read:customer_profiles", "write:outreach", "write:loyalty_accounts"],
    escalationRules: ["Escalate customers with 3+ returns in 90 days to Store Manager for review"],
    lifecycle: "available" as const,
  },
  {
    key: "retail_merchandising_coordinator",
    label: "Merchandising Coordinator",
    mission: "Maximize sell-through and sales per square foot by ensuring the right product is in the right place at the right time.",
    responsibilities: [
      "Execute planogram and floor layout updates",
      "Set up promotional displays and seasonal fixtures",
      "Monitor category performance and propose resets",
      "Coordinate markdown and clearance signage",
    ],
    capabilities: [
      "Planogram execution",
      "Display setup and maintenance",
      "Category performance analysis",
      "Promotional coordination",
    ],
    requiredTools: ["planogram_tool", "inventory_system", "task_manager"],
    kpis: ["retail_sales_per_sqft", "retail_sell_through_rate", "retail_conversion_rate"],
    permissions: ["read:inventory", "write:task_completions", "write:display_records"],
    escalationRules: ["Escalate category sell-through below 40% in 45 days to Inventory Manager"],
    lifecycle: "available" as const,
  },
];

export function seedAiEmployees(): void {
  for (const employee of aiEmployees) {
    aiEmployeeRegistry.register(employee);
  }
}
