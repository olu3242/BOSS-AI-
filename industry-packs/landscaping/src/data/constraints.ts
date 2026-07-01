import { constraintRegistry } from "@boss/registries";

const constraints = [
  {
    key: "lscape_crew_utilization_low",
    label: "Crew Utilization Too Low",
    description: "Crews are not fully booked, resulting in paid idle time and reduced revenue per crew hour.",
    relatedCapabilities: ["crew_scheduling", "job_dispatch"],
  },
  {
    key: "lscape_estimate_conversion_low",
    label: "Estimate Conversion Rate Too Low",
    description: "Less than 40% of sent estimates are converting to booked jobs, indicating pricing, speed, or follow-up issues.",
    relatedCapabilities: ["estimate_management", "customer_follow_up"],
  },
  {
    key: "lscape_equipment_breakdown_high",
    label: "Equipment Breakdown Frequency Too High",
    description: "Frequent equipment breakdowns are grounding crews, delaying jobs, and eroding customer trust.",
    relatedCapabilities: ["equipment_maintenance", "asset_tracking"],
  },
  {
    key: "lscape_material_costs_high",
    label: "Material Costs Too High",
    description: "Material costs exceed 20% of revenue, compressing gross margins below acceptable levels.",
    relatedCapabilities: ["procurement", "supplier_management"],
  },
  {
    key: "lscape_seasonal_revenue_gap",
    label: "Seasonal Revenue Gap",
    description: "Off-season revenue has dropped below 70% of the baseline average, creating cash flow risk.",
    relatedCapabilities: ["service_diversification", "contract_sales"],
  },
  {
    key: "lscape_customer_churn_high",
    label: "Customer Churn Too High",
    description: "Customer retention rate has dropped below 75%, indicating service quality or communication issues.",
    relatedCapabilities: ["customer_retention", "service_quality"],
  },
  {
    key: "lscape_labor_cost_high",
    label: "Labor Cost Too High",
    description: "Labor costs exceed 35% of revenue, driven by inefficient routing, crew overstaffing, or overtime.",
    relatedCapabilities: ["crew_management", "route_optimization"],
  },
];

export function seedConstraints(): void {
  for (const constraint of constraints) {
    constraintRegistry.register(constraint);
  }
}
