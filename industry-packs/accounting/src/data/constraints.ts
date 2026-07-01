import { constraintRegistry } from "@boss/registries";

const constraints = [
  {
    key: "acct_capacity_constraint",
    label: "Capacity Constraint",
    description: "Staff at full utilization, preventing intake of new engagements",
    relatedCapabilities: ["staffing", "delegation", "work_prioritization"],
  },
  {
    key: "acct_high_ar_days",
    label: "High AR Days Outstanding",
    description: "Accounts receivable aging exceeds 45 days, creating cash flow pressure",
    relatedCapabilities: ["billing_management", "payment_collection", "client_communication"],
  },
  {
    key: "acct_high_write_offs",
    label: "Excessive Write-Offs",
    description: "Write-off rate above 8% indicating scope creep or billing discipline issues",
    relatedCapabilities: ["engagement_scoping", "billing_discipline", "client_expectations"],
  },
  {
    key: "acct_low_new_clients",
    label: "Insufficient New Client Flow",
    description: "New client intake below target, threatening future revenue pipeline",
    relatedCapabilities: ["business_development", "referral_management", "marketing"],
  },
  {
    key: "acct_low_client_retention",
    label: "Low Client Retention",
    description: "Client retention rate below 85%, indicating service or relationship issues",
    relatedCapabilities: ["client_communication", "service_quality", "relationship_management"],
  },
  {
    key: "acct_compliance_risk",
    label: "Compliance Risk",
    description: "Risk of missed tax deadlines or filing errors creating client liability",
    relatedCapabilities: ["deadline_management", "quality_control", "workflow_management"],
  },
  {
    key: "acct_below_market_rates",
    label: "Below-Market Rates",
    description: "Billing rates below local market average, leaving revenue on the table",
    relatedCapabilities: ["pricing_strategy", "value_communication"],
  },
  {
    key: "acct_manual_processes",
    label: "Manual Administrative Processes",
    description: "Time-consuming manual workflows reducing billable capacity",
    relatedCapabilities: ["automation", "workflow_optimization", "technology_adoption"],
  },
  {
    key: "acct_low_avg_engagement_value",
    label: "Low Average Engagement Value",
    description: "Average client fees below market, indicating over-reliance on low-margin work",
    relatedCapabilities: ["service_packaging", "advisory_development", "client_mix_management"],
  },
];

export function seedConstraints(): void {
  for (const constraint of constraints) {
    constraintRegistry.register(constraint);
  }
}
