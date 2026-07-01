import { constraintRegistry } from "@boss/registries";

const constraints = [
  {
    key: "dental_no_show_rate_high",
    label: "No-Show Rate Too High",
    description: "No-show rate exceeds 8%, causing unrecoverable chair time loss and provider underutilization.",
    relatedCapabilities: ["appointment_scheduling", "patient_reminders", "cancellation_management"],
  },
  {
    key: "dental_low_case_acceptance",
    label: "Low Case Acceptance Rate",
    description: "Case acceptance is below 65%, meaning most diagnosed treatment is not being completed, suppressing production.",
    relatedCapabilities: ["treatment_presentation", "patient_financing", "follow_up_coordination"],
  },
  {
    key: "dental_low_recall_rate",
    label: "Low Recall Completion Rate",
    description: "Recall completion is below 75%, indicating the hygiene schedule is underperforming and patients are lapsing.",
    relatedCapabilities: ["recall_scheduling", "patient_outreach", "hygiene_coordination"],
  },
  {
    key: "dental_low_collections_ratio",
    label: "Collections Ratio Below Target",
    description: "Collections are below 95% of production, pointing to billing errors, claim denials, or patient payment gaps.",
    relatedCapabilities: ["insurance_billing", "claim_submission", "patient_payment_collection"],
  },
  {
    key: "dental_chair_underutilized",
    label: "Chair Utilization Below 80%",
    description: "Available chair time is less than 80% booked, reducing provider productivity and practice revenue.",
    relatedCapabilities: ["schedule_management", "cancellation_fill", "last_minute_scheduling"],
  },
  {
    key: "dental_high_cancellation_rate",
    label: "Cancellation Rate Too High",
    description: "Late cancellations exceed 5%, creating schedule instability and lost production that is difficult to backfill.",
    relatedCapabilities: ["appointment_scheduling", "patient_reminders", "cancellation_policy_enforcement"],
  },
];

export function seedConstraints(): void {
  for (const constraint of constraints) {
    constraintRegistry.register(constraint);
  }
}
