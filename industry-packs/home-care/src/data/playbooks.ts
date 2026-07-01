import { playbookRegistry } from "@boss/registries";

const playbooks = [
  {
    key: "hcare_caregiver_retention_playbook",
    label: "Caregiver Retention Playbook",
    description: "Structured approach to identifying at-risk caregivers, addressing root causes of turnover, and implementing targeted retention interventions.",
    trigger: "constraint_detected" as const,
    triggerCondition: "hcare_caregiver_turnover_high",
    steps: [
      {
        order: 1,
        action: "Pull turnover data for the past 90 days and segment by tenure, shift type, and assigned client",
        owner: "hcare_caregiver_manager",
        expectedOutcome: "Root cause patterns identified — whether turnover is linked to specific clients, schedules, or compensation gaps",
        timelineHours: 2,
      },
      {
        order: 2,
        action: "Conduct stay interviews with caregivers who have been employed 3–12 months to surface retention risks before they leave",
        owner: "hcare_caregiver_manager",
        expectedOutcome: "At-risk caregivers identified and individual concerns documented",
        timelineHours: 8,
      },
      {
        order: 3,
        action: "Review compensation structure and compare to local market rates; propose adjustments if below market",
        owner: "hcare_caregiver_manager",
        expectedOutcome: "Compensation gap analysis completed with recommended adjustments",
        timelineHours: 3,
      },
      {
        order: 4,
        action: "Launch recognition program for caregivers with 6+ months tenure — milestone bonuses, caregiver of the month",
        owner: "hcare_caregiver_manager",
        expectedOutcome: "Retention program active and communicated to all caregivers",
        timelineHours: 4,
      },
      {
        order: 5,
        action: "Monitor 30-day rolling turnover rate and adjust interventions based on outcomes",
        owner: "hcare_caregiver_manager",
        expectedOutcome: "Turnover rate trending below threshold within 60 days",
        timelineHours: 1,
      },
    ],
    relatedDecisionKeys: ["hcare_hire_caregivers", "hcare_implement_caregiver_training"],
    estimatedTotalHours: 18,
  },
  {
    key: "hcare_missed_visit_playbook",
    label: "Missed Visit Reduction Playbook",
    description: "End-to-end protocol for diagnosing causes of missed visits and implementing scheduling and accountability measures to drive the rate below 3%.",
    trigger: "kpi_below_target" as const,
    triggerCondition: "hcare_missed_visit_rate > 5%",
    steps: [
      {
        order: 1,
        action: "Audit missed visit logs for the past 30 days — categorize by caregiver no-show, client cancellation, scheduling error, or transportation issue",
        owner: "hcare_scheduling_coordinator",
        expectedOutcome: "Primary cause categories ranked by frequency",
        timelineHours: 2,
      },
      {
        order: 2,
        action: "Activate real-time GPS check-in alerts so the scheduling coordinator is notified within 10 minutes of a missed check-in",
        owner: "hcare_scheduling_coordinator",
        expectedOutcome: "All missed check-ins trigger immediate backup dispatch protocol",
        timelineHours: 1,
      },
      {
        order: 3,
        action: "Build an on-call caregiver roster for each service zone to fill coverage gaps within 60 minutes",
        owner: "hcare_scheduling_coordinator",
        expectedOutcome: "On-call coverage roster in place for all active service areas",
        timelineHours: 3,
      },
      {
        order: 4,
        action: "Issue written corrective notice to caregivers with 2+ missed shifts in 30 days and document in personnel file",
        owner: "hcare_caregiver_manager",
        expectedOutcome: "Repeat offenders on formal improvement plan",
        timelineHours: 2,
      },
    ],
    relatedDecisionKeys: ["hcare_adopt_care_management_software", "hcare_hire_caregivers"],
    estimatedTotalHours: 8,
  },
  {
    key: "hcare_client_retention_playbook",
    label: "Client Retention Playbook",
    description: "Proactive protocol for identifying clients at risk of discontinuing service and intervening before they churn.",
    trigger: "constraint_detected" as const,
    triggerCondition: "hcare_client_churn_high",
    steps: [
      {
        order: 1,
        action: "Pull client satisfaction scores and flag all clients with scores below 7.5 or those who have had 2+ complaints in the past 60 days",
        owner: "hcare_client_relations_manager",
        expectedOutcome: "At-risk client list prioritized for outreach",
        timelineHours: 1,
      },
      {
        order: 2,
        action: "Call each at-risk client or family contact within 24 hours to discuss concerns and offer a care plan review",
        owner: "hcare_care_coordinator",
        expectedOutcome: "All at-risk clients contacted and feedback documented",
        timelineHours: 4,
      },
      {
        order: 3,
        action: "For clients unhappy with their caregiver, initiate a rematch process within 48 hours",
        owner: "hcare_care_coordinator",
        expectedOutcome: "New caregiver assigned and first visit completed within 5 business days",
        timelineHours: 2,
      },
      {
        order: 4,
        action: "Send weekly family progress updates for the following 4 weeks to demonstrate improved engagement",
        owner: "hcare_client_relations_manager",
        expectedOutcome: "Family confidence restored; client satisfaction score improves on next survey",
        timelineHours: 1,
      },
    ],
    relatedDecisionKeys: ["hcare_launch_family_portal", "hcare_add_specialized_care"],
    estimatedTotalHours: 8,
  },
  {
    key: "hcare_utilization_boost_playbook",
    label: "Caregiver Utilization Boost Playbook",
    description: "Systematic approach to filling underutilized caregiver capacity by accelerating client intake and expanding hours with existing clients.",
    trigger: "kpi_below_target" as const,
    triggerCondition: "hcare_caregiver_utilization < 70%",
    steps: [
      {
        order: 1,
        action: "Identify caregivers with available hours and map their skills and certifications to client waitlist needs",
        owner: "hcare_scheduling_coordinator",
        expectedOutcome: "Available caregiver capacity matched to specific client opportunities",
        timelineHours: 2,
      },
      {
        order: 2,
        action: "Contact existing clients to offer additional care hours or expanded services",
        owner: "hcare_care_coordinator",
        expectedOutcome: "Additional hours accepted by at least 20% of contacted clients",
        timelineHours: 3,
      },
      {
        order: 3,
        action: "Activate referral source outreach — call top 5 hospital discharge planners and physician offices to increase referral pipeline",
        owner: "hcare_client_relations_manager",
        expectedOutcome: "At least 3 new referrals generated within 2 weeks",
        timelineHours: 4,
      },
      {
        order: 4,
        action: "Review and update online presence and Google Business listing to capture organic demand",
        owner: "hcare_client_relations_manager",
        expectedOutcome: "Inbound inquiry volume increases within 30 days",
        timelineHours: 2,
      },
    ],
    relatedDecisionKeys: ["hcare_expand_service_area", "hcare_partner_with_referral_sources"],
    estimatedTotalHours: 11,
  },
];

export function seedPlaybooks(): void {
  for (const playbook of playbooks) {
    playbookRegistry.register(playbook);
  }
}
