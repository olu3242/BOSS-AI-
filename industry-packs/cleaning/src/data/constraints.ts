import { constraintRegistry } from "@boss/registries";

const constraints = [
  {
    key: "clean_cleaner_utilization_low",
    label: "Cleaner Utilization Too Low",
    description: "Cleaner utilization is below 75%, meaning available labor capacity is not being converted to billable revenue.",
    relatedCapabilities: ["scheduling", "job_dispatch"],
  },
  {
    key: "clean_quality_score_low",
    label: "Quality Score Below Target",
    description: "Average quality inspection score is below 90, indicating inconsistent service standards that risk client retention.",
    relatedCapabilities: ["quality_management", "training"],
  },
  {
    key: "clean_complaint_rate_high",
    label: "Complaint Rate Too High",
    description: "Complaint rate exceeds 2 per 100 jobs, signaling recurring service failures that damage client trust.",
    relatedCapabilities: ["customer_service", "quality_assurance"],
  },
  {
    key: "clean_supply_costs_high",
    label: "Supply Costs Too High",
    description: "Supply costs exceed 10% of revenue, compressing margins and signaling procurement or waste inefficiency.",
    relatedCapabilities: ["procurement", "inventory_management"],
  },
  {
    key: "clean_labor_cost_high",
    label: "Labor Cost Too High",
    description: "Labor costs exceed 45% of revenue, requiring route optimization or pricing adjustments to restore margins.",
    relatedCapabilities: ["workforce_management", "route_optimization"],
  },
  {
    key: "clean_customer_churn_high",
    label: "Customer Churn Too High",
    description: "Customer retention rate is below 80%, indicating clients are not rebooking and recurring revenue is at risk.",
    relatedCapabilities: ["customer_retention", "service_quality"],
  },
  {
    key: "clean_no_show_rate_high",
    label: "No-Show Rate Too High",
    description: "Cleaners are failing to arrive for scheduled jobs at an unacceptable rate, causing client dissatisfaction and lost revenue.",
    relatedCapabilities: ["scheduling", "staff_management"],
  },
];

export function seedConstraints(): void {
  for (const constraint of constraints) {
    constraintRegistry.register(constraint);
  }
}
