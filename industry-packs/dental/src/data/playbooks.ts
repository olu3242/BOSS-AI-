import { playbookRegistry } from "@boss/registries";

const playbooks = [
  {
    key: "dental_recall_playbook",
    label: "Recall & Reappointment Playbook",
    description: "End-to-end protocol for identifying overdue patients, executing multi-touch outreach, and filling the hygiene schedule.",
    trigger: "kpi_below_target" as const,
    triggerCondition: "dental_recall_completion < 75%",
    steps: [
      {
        order: 1,
        action: "Pull list of patients 30+ days overdue for recall from the practice management system",
        owner: "dental_recall_coordinator",
        expectedOutcome: "Prioritized recall list segmented by lapse duration",
        timelineHours: 1,
      },
      {
        order: 2,
        action: "Send first recall message via patient's preferred channel (text or email)",
        owner: "dental_recall_coordinator",
        expectedOutcome: "Initial contact made with all overdue patients",
        timelineHours: 2,
      },
      {
        order: 3,
        action: "Follow up by phone with non-responders after 5 business days",
        owner: "dental_front_desk_coordinator",
        expectedOutcome: "Additional bookings secured from phone outreach",
        timelineHours: 4,
      },
      {
        order: 4,
        action: "Escalate 12-month lapsed patients to reactivation campaign",
        owner: "dental_patient_success_coordinator",
        expectedOutcome: "Lapsed patients entered into dedicated reactivation workflow",
        timelineHours: 1,
      },
      {
        order: 5,
        action: "Review recall completion rate weekly and adjust outreach cadence if below target",
        owner: "dental_practice_manager",
        expectedOutcome: "Recall rate trending toward 75% threshold",
        timelineHours: 1,
      },
    ],
    relatedDecisionKeys: ["dental_increase_recall_outreach", "dental_expand_hygiene_capacity"],
    estimatedTotalHours: 9,
  },
  {
    key: "dental_case_presentation_playbook",
    label: "Case Acceptance Playbook",
    description: "Structured approach to presenting diagnosed treatment plans in a way that builds patient confidence and drives same-visit acceptance.",
    trigger: "kpi_below_target" as const,
    triggerCondition: "dental_case_acceptance < 65%",
    steps: [
      {
        order: 1,
        action: "Review treatment plan with dentist before patient consultation to clarify priorities",
        owner: "dental_treatment_coordinator",
        expectedOutcome: "Coordinator understands the clinical rationale and urgency sequence",
        timelineHours: 0.5,
      },
      {
        order: 2,
        action: "Present treatment plan with visual aids, phased approach, and out-of-pocket estimates",
        owner: "dental_treatment_coordinator",
        expectedOutcome: "Patient understands diagnosis, cost, and sequencing",
        timelineHours: 0.5,
      },
      {
        order: 3,
        action: "Offer financing options (CareCredit, in-house plan) and schedule Phase 1 before patient leaves",
        owner: "dental_treatment_coordinator",
        expectedOutcome: "At least Phase 1 of treatment booked at time of consultation",
        timelineHours: 0.5,
      },
      {
        order: 4,
        action: "Follow up with undecided patients via personalized message within 48 hours",
        owner: "dental_treatment_coordinator",
        expectedOutcome: "Recovery of deferred treatment acceptances",
        timelineHours: 1,
      },
    ],
    relatedDecisionKeys: ["dental_improve_case_acceptance", "dental_increase_production"],
    estimatedTotalHours: 2.5,
  },
  {
    key: "dental_no_show_reduction_playbook",
    label: "No-Show Reduction Playbook",
    description: "Systematic approach to reducing appointment no-shows and late cancellations through smarter confirmation workflows and accountability measures.",
    trigger: "constraint_detected" as const,
    triggerCondition: "dental_no_show_rate_high",
    steps: [
      {
        order: 1,
        action: "Audit no-show patterns by patient segment, appointment type, and provider over the past 90 days",
        owner: "dental_practice_manager",
        expectedOutcome: "Root cause identified — time slot, patient segment, or appointment type driving no-shows",
        timelineHours: 2,
      },
      {
        order: 2,
        action: "Activate 3-touch confirmation sequence: 72h email, 48h text, 24h call for high-risk appointments",
        owner: "dental_front_desk_coordinator",
        expectedOutcome: "All appointments confirmed at least 24 hours in advance",
        timelineHours: 1,
      },
      {
        order: 3,
        action: "Implement deposit requirement ($25–$50) for patients with 2+ prior no-shows",
        owner: "dental_practice_manager",
        expectedOutcome: "High-risk patient no-show rate decreases by 30%+",
        timelineHours: 1,
      },
      {
        order: 4,
        action: "Build a same-day fill list from patients awaiting appointment openings",
        owner: "dental_front_desk_coordinator",
        expectedOutcome: "Cancelled slots filled within 2 hours on average",
        timelineHours: 2,
      },
    ],
    relatedDecisionKeys: ["dental_reduce_no_shows", "dental_fill_open_schedule_gaps"],
    estimatedTotalHours: 6,
  },
  {
    key: "dental_collections_playbook",
    label: "Collections Optimization Playbook",
    description: "Tighten the billing cycle to ensure every dollar produced is collected through accurate claim submission and proactive patient balance follow-up.",
    trigger: "constraint_detected" as const,
    triggerCondition: "dental_low_collections_ratio",
    steps: [
      {
        order: 1,
        action: "Audit last 60 days of claims for denial reasons and common billing errors",
        owner: "dental_revenue_coordinator",
        expectedOutcome: "Top 3 denial categories identified and root causes addressed",
        timelineHours: 3,
      },
      {
        order: 2,
        action: "Verify insurance eligibility for all appointments scheduled in the next 2 weeks",
        owner: "dental_front_desk_coordinator",
        expectedOutcome: "Zero eligibility surprises at time of service",
        timelineHours: 2,
      },
      {
        order: 3,
        action: "Submit all claims within 24 hours of completed treatment",
        owner: "dental_revenue_coordinator",
        expectedOutcome: "Clean claim submission rate above 95%",
        timelineHours: 1,
      },
      {
        order: 4,
        action: "Follow up on unpaid patient balances over $50 via text and statement at 30 days",
        owner: "dental_revenue_coordinator",
        expectedOutcome: "Outstanding patient AR reduced by 20% within 60 days",
        timelineHours: 2,
      },
    ],
    relatedDecisionKeys: ["dental_improve_collections"],
    estimatedTotalHours: 8,
  },
];

export function seedPlaybooks(): void {
  for (const playbook of playbooks) {
    playbookRegistry.register(playbook);
  }
}
