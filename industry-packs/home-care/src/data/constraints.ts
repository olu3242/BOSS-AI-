import { constraintRegistry } from "@boss/registries";

const constraints = [
  {
    key: "hcare_caregiver_shortage",
    label: "Caregiver Shortage",
    description: "Insufficient caregiver headcount to meet current client demand, causing uncovered shifts and inability to accept new clients.",
    relatedCapabilities: ["recruitment", "workforce_management"],
  },
  {
    key: "hcare_missed_visits_high",
    label: "Missed Visit Rate Too High",
    description: "Missed visit rate exceeds 3%, resulting in client safety risk, family dissatisfaction, and unbillable scheduled hours.",
    relatedCapabilities: ["scheduling", "caregiver_reliability"],
  },
  {
    key: "hcare_caregiver_turnover_high",
    label: "Caregiver Turnover Too High",
    description: "Caregiver turnover exceeds industry benchmarks, driving up recruitment costs and disrupting client care continuity.",
    relatedCapabilities: ["retention", "compensation_management"],
  },
  {
    key: "hcare_client_churn_high",
    label: "Client Churn Rate Too High",
    description: "Client attrition is elevated, indicating dissatisfaction with care quality, caregiver matching, or communication.",
    relatedCapabilities: ["care_quality", "client_relations"],
  },
  {
    key: "hcare_billing_errors_high",
    label: "Billing Error Rate Too High",
    description: "Billing errors or discrepancies between scheduled and billed hours are causing revenue leakage and client disputes.",
    relatedCapabilities: ["billing_management", "documentation"],
  },
  {
    key: "hcare_caregiver_utilization_low",
    label: "Caregiver Utilization Below Target",
    description: "Caregiver utilization is below 75%, meaning significant payroll cost is being incurred without corresponding billable revenue.",
    relatedCapabilities: ["scheduling", "capacity_management"],
  },
  {
    key: "hcare_compliance_gap",
    label: "Compliance Gap Detected",
    description: "Documentation, training, or supervisory visit requirements are not being met, creating regulatory risk and potential license jeopardy.",
    relatedCapabilities: ["compliance_management", "training"],
  },
];

export function seedConstraints(): void {
  for (const constraint of constraints) {
    constraintRegistry.register(constraint);
  }
}
