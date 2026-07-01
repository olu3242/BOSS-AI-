import { playbookRegistry } from "@boss/registries";

const playbooks = [
  {
    key: "lscape_slow_season_playbook",
    label: "Slow Season Revenue Recovery Playbook",
    description: "Action plan to stabilize revenue during the off-season by activating alternative services and locking in contracts for the upcoming peak season.",
    trigger: "kpi_below_target" as const,
    triggerCondition: "lscape_seasonal_revenue_index < 0.7",
    steps: [
      {
        order: 1,
        action: "Analyze prior year off-season revenue by service type and customer segment to identify highest-potential recovery areas",
        owner: "lscape_seasonal_planner",
        expectedOutcome: "Ranked list of off-season revenue opportunities with estimated revenue potential",
        timelineHours: 3,
      },
      {
        order: 2,
        action: "Launch targeted outreach to existing customers offering off-season services (snow removal, holiday lighting, cleanup)",
        owner: "lscape_customer_relations_manager",
        expectedOutcome: "At least 20% of existing customers engaged with off-season service offer",
        timelineHours: 4,
      },
      {
        order: 3,
        action: "Reach out to commercial property managers and HOAs to pitch multi-season maintenance contracts",
        owner: "lscape_estimator",
        expectedOutcome: "5+ commercial contract proposals submitted within 2 weeks",
        timelineHours: 8,
      },
      {
        order: 4,
        action: "Reduce crew hours proportionally and offer voluntary time-off to manage labor costs during slow period",
        owner: "lscape_operations_manager",
        expectedOutcome: "Labor cost % maintained below 38% during off-season",
        timelineHours: 2,
      },
      {
        order: 5,
        action: "Review and adjust seasonal revenue index weekly and report to owner with updated forecast",
        owner: "lscape_seasonal_planner",
        expectedOutcome: "Revenue index trending back toward 0.8 within 4 weeks",
        timelineHours: 1,
      },
    ],
    relatedDecisionKeys: ["lscape_add_service_line", "lscape_hire_seasonal_crew", "lscape_pursue_commercial_contracts"],
    estimatedTotalHours: 18,
  },
  {
    key: "lscape_estimate_conversion_playbook",
    label: "Estimate Conversion Improvement Playbook",
    description: "Systematic approach to increasing estimate-to-job conversion by improving speed, pricing accuracy, and follow-up discipline.",
    trigger: "kpi_below_target" as const,
    triggerCondition: "lscape_estimate_conversion_rate < 40%",
    steps: [
      {
        order: 1,
        action: "Audit the last 60 days of unconverted estimates — identify common objections (price, timing, scope, competitor)",
        owner: "lscape_estimator",
        expectedOutcome: "Top 3 loss reasons identified with supporting data",
        timelineHours: 2,
      },
      {
        order: 2,
        action: "Reduce estimate delivery time to under 24 hours for residential and 48 hours for commercial",
        owner: "lscape_estimator",
        expectedOutcome: "Speed-to-estimate improved, early-stage dropout reduced",
        timelineHours: 1,
      },
      {
        order: 3,
        action: "Send personalized follow-up message to all open estimates at 3 days and 7 days after delivery",
        owner: "lscape_customer_relations_manager",
        expectedOutcome: "Recovery of 10%+ of stalled estimates through follow-up",
        timelineHours: 2,
      },
      {
        order: 4,
        action: "Offer a limited-time new customer incentive (first service discount or free add-on) to accelerate decisions",
        owner: "lscape_estimator",
        expectedOutcome: "Conversion rate improvement of 5+ percentage points within 30 days",
        timelineHours: 1,
      },
    ],
    relatedDecisionKeys: ["lscape_launch_referral_program"],
    estimatedTotalHours: 6,
  },
  {
    key: "lscape_equipment_reliability_playbook",
    label: "Equipment Reliability Playbook",
    description: "Restore equipment reliability by auditing breakdown history, implementing preventive maintenance, and planning capital replacements.",
    trigger: "constraint_detected" as const,
    triggerCondition: "lscape_equipment_breakdown_high",
    steps: [
      {
        order: 1,
        action: "Audit all equipment breakdown incidents from the past 90 days — identify which assets have the highest failure rates",
        owner: "lscape_equipment_coordinator",
        expectedOutcome: "High-risk equipment list ranked by breakdown frequency and revenue impact",
        timelineHours: 3,
      },
      {
        order: 2,
        action: "Schedule immediate inspection and service for all high-risk equipment with a certified mechanic",
        owner: "lscape_equipment_coordinator",
        expectedOutcome: "All high-risk equipment serviced and cleared for operation",
        timelineHours: 8,
      },
      {
        order: 3,
        action: "Implement weekly pre-shift equipment inspection checklist for all crew leaders",
        owner: "lscape_operations_manager",
        expectedOutcome: "Zero undetected breakdowns — all issues identified before deployment",
        timelineHours: 2,
      },
      {
        order: 4,
        action: "Evaluate cost-benefit of purchasing replacement equipment vs. continued repair for assets with 3+ breakdowns in 90 days",
        owner: "lscape_operations_manager",
        expectedOutcome: "Capital replacement recommendation submitted to owner",
        timelineHours: 2,
      },
    ],
    relatedDecisionKeys: ["lscape_equipment_purchase"],
    estimatedTotalHours: 15,
  },
  {
    key: "lscape_customer_retention_playbook",
    label: "Customer Retention Recovery Playbook",
    description: "Recover customer retention rate by identifying at-risk customers, resolving service issues, and launching re-engagement campaigns.",
    trigger: "constraint_detected" as const,
    triggerCondition: "lscape_customer_churn_high",
    steps: [
      {
        order: 1,
        action: "Pull list of customers who have not rescheduled in 45+ days and segment by service history and value",
        owner: "lscape_customer_relations_manager",
        expectedOutcome: "At-risk customer list segmented by churn risk level",
        timelineHours: 2,
      },
      {
        order: 2,
        action: "Call high-value at-risk customers personally to understand their concerns and offer a service guarantee",
        owner: "lscape_operations_manager",
        expectedOutcome: "Direct feedback gathered from 50%+ of high-value at-risk customers",
        timelineHours: 4,
      },
      {
        order: 3,
        action: "Send win-back offer to lapsed customers with a personalized message and priority scheduling",
        owner: "lscape_customer_relations_manager",
        expectedOutcome: "10%+ of lapsed customers rebooked within 2 weeks",
        timelineHours: 2,
      },
      {
        order: 4,
        action: "Launch referral program to stabilize customer base and reduce dependency on at-risk accounts",
        owner: "lscape_customer_relations_manager",
        expectedOutcome: "Referral program live and 3+ referrals received within 30 days",
        timelineHours: 3,
      },
    ],
    relatedDecisionKeys: ["lscape_launch_referral_program", "lscape_pursue_commercial_contracts"],
    estimatedTotalHours: 11,
  },
];

export function seedPlaybooks(): void {
  for (const playbook of playbooks) {
    playbookRegistry.register(playbook);
  }
}
