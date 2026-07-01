import { playbookRegistry } from "@boss/registries";

const playbooks = [
  {
    key: "clean_quality_recovery_playbook",
    label: "Quality Recovery Playbook",
    description: "Structured response to declining quality scores, including immediate inspection, retraining, and client remediation.",
    trigger: "constraint_detected" as const,
    triggerCondition: "clean_quality_score_low",
    steps: [
      {
        order: 1,
        action: "Pull inspection scores for the past 30 days and identify cleaners and job types with the lowest scores",
        owner: "clean_quality_inspector",
        expectedOutcome: "Root cause of quality decline identified by cleaner, location, or checklist category",
        timelineHours: 2,
      },
      {
        order: 2,
        action: "Conduct unannounced spot inspections on the bottom 20% of performing cleaners",
        owner: "clean_quality_inspector",
        expectedOutcome: "Direct observation of service gaps and non-compliance with checklist",
        timelineHours: 8,
      },
      {
        order: 3,
        action: "Schedule mandatory retraining session for underperforming cleaners covering standards and checklist requirements",
        owner: "clean_team_supervisor",
        expectedOutcome: "All underperforming cleaners complete retraining within 5 business days",
        timelineHours: 4,
      },
      {
        order: 4,
        action: "Contact affected clients with an apology, explanation, and remediation offer (re-clean or discount)",
        owner: "clean_customer_relations_manager",
        expectedOutcome: "All impacted clients contacted and remediation accepted or declined within 48 hours",
        timelineHours: 2,
      },
      {
        order: 5,
        action: "Monitor quality scores weekly for 30 days and escalate if score remains below 85",
        owner: "clean_operations_manager",
        expectedOutcome: "Quality score trending above 90 within 30 days",
        timelineHours: 1,
      },
    ],
    relatedDecisionKeys: ["clean_implement_quality_program", "clean_invest_in_equipment"],
    estimatedTotalHours: 17,
  },
  {
    key: "clean_utilization_boost_playbook",
    label: "Cleaner Utilization Boost Playbook",
    description: "Tactics to increase billable hours per cleaner when utilization falls below target through scheduling and marketing actions.",
    trigger: "kpi_below_target" as const,
    triggerCondition: "clean_cleaner_utilization < 70%",
    steps: [
      {
        order: 1,
        action: "Audit the current schedule to identify patterns of low-utilization days, times, and routes",
        owner: "clean_scheduling_coordinator",
        expectedOutcome: "Clear picture of where and when utilization gaps occur",
        timelineHours: 2,
      },
      {
        order: 2,
        action: "Reoptimize cleaner routes to cluster jobs geographically and reduce travel time waste",
        owner: "clean_scheduling_coordinator",
        expectedOutcome: "Average travel time between jobs reduced by 20%+",
        timelineHours: 3,
      },
      {
        order: 3,
        action: "Launch targeted promotion to existing clients offering discounts for adding or upgrading frequency",
        owner: "clean_customer_relations_manager",
        expectedOutcome: "At least 10% of contacted clients increase booking frequency",
        timelineHours: 2,
      },
      {
        order: 4,
        action: "Review and activate commercial client pipeline if available capacity persists",
        owner: "clean_operations_manager",
        expectedOutcome: "At least one commercial prospect contacted per available cleaner slot",
        timelineHours: 2,
      },
    ],
    relatedDecisionKeys: ["clean_expand_service_area", "clean_pursue_commercial_contracts"],
    estimatedTotalHours: 9,
  },
  {
    key: "clean_retention_playbook",
    label: "Customer Retention Playbook",
    description: "Proactive approach to preventing client churn through satisfaction monitoring, re-engagement, and loyalty incentives.",
    trigger: "constraint_detected" as const,
    triggerCondition: "clean_customer_churn_high",
    steps: [
      {
        order: 1,
        action: "Identify clients who have not rebooked within their expected recurring window",
        owner: "clean_customer_relations_manager",
        expectedOutcome: "At-risk client list segmented by lapse duration and value",
        timelineHours: 1,
      },
      {
        order: 2,
        action: "Send personalized re-engagement message to clients lapsed 2–4 weeks with a win-back offer",
        owner: "clean_customer_relations_manager",
        expectedOutcome: "At least 25% of lapsed clients rebook within 7 days",
        timelineHours: 2,
      },
      {
        order: 3,
        action: "Call high-value clients lapsed more than 4 weeks to understand reason for discontinuation",
        owner: "clean_customer_relations_manager",
        expectedOutcome: "Churn reason documented and addressed for each high-value client",
        timelineHours: 4,
      },
      {
        order: 4,
        action: "Launch referral and loyalty program to incentivize long-term retention",
        owner: "clean_operations_manager",
        expectedOutcome: "Referral program active and communicated to all current clients",
        timelineHours: 2,
      },
    ],
    relatedDecisionKeys: ["clean_launch_referral_program", "clean_implement_quality_program"],
    estimatedTotalHours: 9,
  },
  {
    key: "clean_commercial_expansion_playbook",
    label: "Commercial Expansion Playbook",
    description: "Step-by-step plan to pursue and close commercial cleaning contracts, from prospecting through contract execution.",
    trigger: "recommendation_approved" as const,
    triggerCondition: "clean_pursue_commercial_contracts approved",
    steps: [
      {
        order: 1,
        action: "Build target list of local commercial prospects: offices, medical, retail, schools within service area",
        owner: "clean_operations_manager",
        expectedOutcome: "Prospect list of 50+ commercial targets with contact information",
        timelineHours: 4,
      },
      {
        order: 2,
        action: "Create commercial service proposal template with pricing tiers for different facility sizes",
        owner: "clean_operations_manager",
        expectedOutcome: "Professional proposal ready to customize per prospect",
        timelineHours: 4,
      },
      {
        order: 3,
        action: "Launch outreach campaign: cold email sequence + LinkedIn + local networking",
        owner: "clean_customer_relations_manager",
        expectedOutcome: "At least 10 qualified appointments scheduled within 30 days",
        timelineHours: 8,
      },
      {
        order: 4,
        action: "Conduct facility walkthroughs and deliver customized proposals to qualified prospects",
        owner: "clean_operations_manager",
        expectedOutcome: "Proposals submitted to 5+ commercial prospects",
        timelineHours: 10,
      },
      {
        order: 5,
        action: "Follow up on proposals and negotiate contract terms; onboard first commercial client",
        owner: "clean_operations_manager",
        expectedOutcome: "First commercial contract signed within 90 days of campaign launch",
        timelineHours: 6,
      },
    ],
    relatedDecisionKeys: ["clean_pursue_commercial_contracts", "clean_expand_service_area"],
    estimatedTotalHours: 32,
  },
];

export function seedPlaybooks(): void {
  for (const playbook of playbooks) {
    playbookRegistry.register(playbook);
  }
}
