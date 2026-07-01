import { constraintRegistry } from "@boss/registries";

const constraints = [
  {
    key: "legal_low_billable_hours",
    label: "Low Billable Hours",
    description: "Attorney billable hours percentage below firm target, reducing revenue capacity",
    relatedCapabilities: ["time_tracking", "matter_management", "workload_planning"],
  },
  {
    key: "legal_high_ar_days",
    label: "High AR Days Outstanding",
    description: "Accounts receivable aging exceeds 60 days, indicating collection problems",
    relatedCapabilities: ["billing_management", "payment_collection", "client_communication"],
  },
  {
    key: "legal_high_write_offs",
    label: "Excessive Write-Offs",
    description: "Write-off rate above 10% indicating billing or intake quality issues",
    relatedCapabilities: ["billing_discipline", "client_intake", "matter_scoping"],
  },
  {
    key: "legal_low_new_matters",
    label: "Insufficient New Matter Flow",
    description: "New matter intake below target, threatening future revenue",
    relatedCapabilities: ["business_development", "referral_management", "marketing"],
  },
  {
    key: "legal_capacity_constraint",
    label: "Capacity Constraint",
    description: "Attorney capacity fully utilized, preventing new matter intake",
    relatedCapabilities: ["staffing", "delegation", "matter_prioritization"],
  },
  {
    key: "legal_low_client_retention",
    label: "Low Client Retention",
    description: "Returning client rate below 60%, indicating satisfaction or relationship issues",
    relatedCapabilities: ["client_communication", "service_quality", "relationship_management"],
  },
  {
    key: "legal_compliance_risk",
    label: "Compliance Risk",
    description: "Missed deadlines or incomplete conflict checks creating malpractice exposure",
    relatedCapabilities: ["deadline_management", "conflict_checking", "file_management"],
  },
  {
    key: "legal_below_market_rates",
    label: "Below-Market Billing Rates",
    description: "Attorney billing rates are below local market rates, leaving revenue on the table",
    relatedCapabilities: ["pricing_strategy", "market_analysis"],
  },
  {
    key: "legal_manual_processes",
    label: "Manual Administrative Processes",
    description: "Time-consuming manual processes for billing, intake, or deadlines reduce attorney productivity",
    relatedCapabilities: ["practice_management_software", "workflow_automation"],
  },
  {
    key: "legal_revenue_concentration",
    label: "Revenue Concentration Risk",
    description: "Excessive revenue dependency on a single practice area or client",
    relatedCapabilities: ["practice_diversification", "business_development"],
  },
];

export function seedConstraints(): void {
  for (const constraint of constraints) {
    constraintRegistry.register(constraint);
  }
}
