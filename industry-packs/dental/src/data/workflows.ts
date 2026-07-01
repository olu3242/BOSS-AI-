import { workflowRegistry } from "@boss/registries";

const workflows = [
  {
    key: "dental_new_patient_intake",
    label: "New Patient Intake",
    description: "Onboard a new patient: collect demographics, insurance, medical history, and preferences.",
    triggerType: "event" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["dental_new_patient_growth"],
  },
  {
    key: "dental_appointment_scheduling",
    label: "Appointment Scheduling",
    description: "Schedule patient appointments based on provider availability, treatment needs, and patient preferences.",
    triggerType: "manual" as const,
    relatedConstraints: ["dental_no_show_rate_high"],
    relatedKpis: ["dental_chair_utilization"],
  },
  {
    key: "dental_confirmation_reminders",
    label: "Confirmation & Reminders",
    description: "Send automated appointment confirmations and reminder sequences to reduce no-shows and late cancellations.",
    triggerType: "schedule" as const,
    relatedConstraints: ["dental_no_show_rate_high", "dental_high_cancellation_rate"],
    relatedKpis: ["dental_no_show_rate", "dental_cancellation_rate"],
  },
  {
    key: "dental_patient_check_in",
    label: "Patient Check-In",
    description: "Streamline patient arrival: digital forms, insurance verification, and room assignment.",
    triggerType: "event" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["dental_chair_utilization"],
  },
  {
    key: "dental_treatment_plan_presentation",
    label: "Treatment Plan Presentation",
    description: "Present diagnosed treatment plans to patients with cost estimates, financing options, and priority sequencing.",
    triggerType: "manual" as const,
    relatedConstraints: ["dental_low_case_acceptance"],
    relatedKpis: ["dental_case_acceptance", "dental_provider_production"],
  },
  {
    key: "dental_insurance_verification",
    label: "Insurance Verification",
    description: "Verify patient insurance eligibility, benefits, and coverage limits before scheduled appointments.",
    triggerType: "schedule" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["dental_collections_ratio"],
  },
  {
    key: "dental_billing",
    label: "Billing & Claims",
    description: "Generate and submit insurance claims, apply adjustments, and produce patient statements.",
    triggerType: "event" as const,
    relatedConstraints: ["dental_low_collections_ratio"],
    relatedKpis: ["dental_collections_ratio", "dental_avg_production_per_visit"],
  },
  {
    key: "dental_payment_collection",
    label: "Payment Collection",
    description: "Collect patient portion payments at checkout and follow up on outstanding balances.",
    triggerType: "event" as const,
    relatedConstraints: ["dental_low_collections_ratio"],
    relatedKpis: ["dental_collections_ratio", "dental_provider_production"],
  },
  {
    key: "dental_recall_scheduling",
    label: "Recall Scheduling",
    description: "Proactively contact patients due for hygiene recall and schedule their next preventive appointment.",
    triggerType: "schedule" as const,
    relatedConstraints: ["dental_low_recall_rate"],
    relatedKpis: ["dental_recall_completion", "dental_hygiene_reappointment"],
  },
  {
    key: "dental_review_request",
    label: "Review Request",
    description: "Request patient reviews after completed appointments to build online reputation.",
    triggerType: "event" as const,
    relatedConstraints: [] as string[],
    relatedKpis: ["dental_new_patient_growth"],
  },
  {
    key: "dental_reactivation_campaign",
    label: "Patient Reactivation",
    description: "Re-engage patients who have not visited in 12+ months with targeted outreach campaigns.",
    triggerType: "schedule" as const,
    relatedConstraints: ["dental_low_recall_rate"],
    relatedKpis: ["dental_recall_completion", "dental_new_patient_growth"],
  },
];

export function seedWorkflows(): void {
  for (const workflow of workflows) {
    workflowRegistry.register(workflow);
  }
}
