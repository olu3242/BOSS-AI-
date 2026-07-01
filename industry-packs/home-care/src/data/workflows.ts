import { workflowRegistry } from "@boss/registries";

const workflows = [
  {
    key: "hcare_client_intake",
    label: "Client Intake",
    description: "Onboard a new client: collect personal details, care needs assessment, insurance information, and emergency contacts.",
    triggerType: "event" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["hcare_referral_conversion_rate"],
  },
  {
    key: "hcare_care_plan_creation",
    label: "Care Plan Creation",
    description: "Develop an individualized care plan based on client assessment, physician orders, and family preferences.",
    triggerType: "manual" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["hcare_client_satisfaction_score", "hcare_avg_weekly_hours_per_client"],
  },
  {
    key: "hcare_caregiver_matching",
    label: "Caregiver Matching",
    description: "Match clients with compatible caregivers based on skills, availability, location, and personality fit.",
    triggerType: "manual" as const,
    relatedConstraints: ["hcare_caregiver_shortage"],
    relatedKpis: ["hcare_caregiver_match_score", "hcare_client_retention_rate"],
  },
  {
    key: "hcare_visit_scheduling",
    label: "Visit Scheduling",
    description: "Schedule recurring care visits based on the approved care plan, caregiver availability, and client preferences.",
    triggerType: "event" as const,
    relatedConstraints: ["hcare_caregiver_shortage", "hcare_caregiver_utilization_low"],
    relatedKpis: ["hcare_caregiver_utilization", "hcare_billable_hours_pct"],
  },
  {
    key: "hcare_caregiver_check_in",
    label: "Caregiver Check-In",
    description: "Verify caregiver arrival at client location via GPS or telephony check-in at the start of each scheduled visit.",
    triggerType: "schedule" as const,
    relatedConstraints: ["hcare_missed_visits_high"],
    relatedKpis: ["hcare_missed_visit_rate", "hcare_billable_hours_pct"],
  },
  {
    key: "hcare_visit_documentation",
    label: "Visit Documentation",
    description: "Record care activities, observations, medication reminders, and client status notes after each completed visit.",
    triggerType: "manual" as const,
    relatedConstraints: ["hcare_compliance_gap"],
    relatedKpis: ["hcare_billable_hours_pct", "hcare_client_satisfaction_score"],
  },
  {
    key: "hcare_invoice_generation",
    label: "Invoice Generation",
    description: "Generate client invoices based on completed and documented visits for the billing cycle.",
    triggerType: "schedule" as const,
    relatedConstraints: ["hcare_billing_errors_high"],
    relatedKpis: ["hcare_revenue_per_caregiver_hour", "hcare_billable_hours_pct"],
  },
  {
    key: "hcare_family_communication",
    label: "Family Communication",
    description: "Send scheduled updates to family members or designated contacts summarizing client status and recent care activities.",
    triggerType: "schedule" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["hcare_client_satisfaction_score", "hcare_client_retention_rate"],
  },
  {
    key: "hcare_caregiver_performance_review",
    label: "Caregiver Performance Review",
    description: "Conduct periodic performance evaluations for caregivers based on attendance, client feedback, and documentation quality.",
    triggerType: "schedule" as const,
    relatedConstraints: ["hcare_caregiver_turnover_high", "hcare_missed_visits_high"],
    relatedKpis: ["hcare_caregiver_turnover_rate", "hcare_caregiver_match_score"],
  },
  {
    key: "hcare_incident_reporting",
    label: "Incident Reporting",
    description: "Document and escalate any incidents, falls, medication errors, or safety concerns that occur during a care visit.",
    triggerType: "event" as const,
    relatedConstraints: ["hcare_compliance_gap"],
    relatedKpis: ["hcare_client_satisfaction_score", "hcare_missed_visit_rate"],
  },
  {
    key: "hcare_care_plan_reassessment",
    label: "Care Plan Reassessment",
    description: "Reassess client care needs on a scheduled basis or after a significant health event to update care plans accordingly.",
    triggerType: "schedule" as const,
    relatedConstraints: ["hcare_client_churn_high"],
    relatedKpis: ["hcare_client_retention_rate", "hcare_avg_weekly_hours_per_client"],
  },
];

export function seedWorkflows(): void {
  for (const workflow of workflows) {
    workflowRegistry.register(workflow);
  }
}
