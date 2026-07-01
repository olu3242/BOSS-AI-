import { playbookRegistry } from "@boss/registries";

const playbooks = [
  {
    key: "cafe_slow_period_playbook",
    label: "Slow Period Recovery Playbook",
    description: "Systematic response to periods of low transaction volume — activate promotions, adjust staffing, and drive foot traffic.",
    trigger: "kpi_below_target" as const,
    triggerCondition: "cafe_transactions_per_hour < 20",
    steps: [
      {
        order: 1,
        action: "Identify the slow period window and compare against historical patterns to determine if it is structural or anomalous",
        owner: "cafe_cafe_manager",
        expectedOutcome: "Root cause categorized: structural slow period vs. one-off event",
        timelineHours: 1,
      },
      {
        order: 2,
        action: "Activate a flash promotion via SMS to loyalty members within 1-mile radius",
        owner: "cafe_marketing_coordinator",
        expectedOutcome: "Loyalty members notified of limited-time offer to drive immediate traffic",
        timelineHours: 0.5,
      },
      {
        order: 3,
        action: "Adjust staff assignments to send non-essential staff on break during low-traffic window",
        owner: "cafe_shift_supervisor",
        expectedOutcome: "Labor cost aligned with actual traffic volume",
        timelineHours: 0.5,
      },
      {
        order: 4,
        action: "Review slow period patterns weekly and adjust scheduling template if recurring",
        owner: "cafe_cafe_manager",
        expectedOutcome: "Staff schedule updated to reflect actual demand curve",
        timelineHours: 1,
      },
    ],
    relatedDecisionKeys: ["cafe_extend_hours", "cafe_launch_loyalty_program"],
    estimatedTotalHours: 3,
  },
  {
    key: "cafe_waste_reduction_playbook",
    label: "Waste Reduction Playbook",
    description: "Step-by-step protocol to identify waste sources, implement portion controls, and bring waste percentage below 5%.",
    trigger: "constraint_detected" as const,
    triggerCondition: "cafe_beverage_waste_high",
    steps: [
      {
        order: 1,
        action: "Pull last 14 days of waste logs and categorize by product, cause, and shift",
        owner: "cafe_head_barista",
        expectedOutcome: "Top 3 waste drivers identified by category",
        timelineHours: 1,
      },
      {
        order: 2,
        action: "Implement batch prep schedule aligned with hourly demand forecast to reduce overproduction",
        owner: "cafe_head_barista",
        expectedOutcome: "Batch sizes calibrated to actual demand by daypart",
        timelineHours: 2,
      },
      {
        order: 3,
        action: "Retrain staff on portion standards and use of measuring tools for all recipes",
        owner: "cafe_head_barista",
        expectedOutcome: "Portion consistency improved across all shifts",
        timelineHours: 2,
      },
      {
        order: 4,
        action: "Review waste log daily for two weeks and compare against pre-intervention baseline",
        owner: "cafe_cafe_manager",
        expectedOutcome: "Waste percentage trending below 5% target",
        timelineHours: 1,
      },
    ],
    relatedDecisionKeys: ["cafe_reduce_waste", "cafe_raise_prices"],
    estimatedTotalHours: 6,
  },
  {
    key: "cafe_loyalty_growth_playbook",
    label: "Loyalty Growth Playbook",
    description: "Accelerate loyalty program enrollment to exceed 30% of transactions through staff training and customer incentives.",
    trigger: "kpi_below_target" as const,
    triggerCondition: "cafe_loyalty_member_pct < 30%",
    steps: [
      {
        order: 1,
        action: "Brief all staff on loyalty enrollment pitch and set a daily enrollment goal per shift",
        owner: "cafe_shift_supervisor",
        expectedOutcome: "Every customer offered loyalty enrollment at point of sale",
        timelineHours: 0.5,
      },
      {
        order: 2,
        action: "Create a sign-up incentive (free item or double points on first purchase) for new enrollees",
        owner: "cafe_marketing_coordinator",
        expectedOutcome: "Incentive active and communicated across all in-store and digital channels",
        timelineHours: 2,
      },
      {
        order: 3,
        action: "Run an email and SMS re-engagement campaign to lapsed loyalty members",
        owner: "cafe_marketing_coordinator",
        expectedOutcome: "Lapsed members reactivated and returning within 30 days",
        timelineHours: 3,
      },
      {
        order: 4,
        action: "Track loyalty enrollment rate weekly and adjust incentive if growth is below 2% per week",
        owner: "cafe_customer_experience_manager",
        expectedOutcome: "Loyalty member percentage trending toward 30% threshold",
        timelineHours: 1,
      },
    ],
    relatedDecisionKeys: ["cafe_launch_loyalty_program", "cafe_partner_with_delivery_app"],
    estimatedTotalHours: 6.5,
  },
  {
    key: "cafe_ticket_size_playbook",
    label: "Ticket Size Growth Playbook",
    description: "Increase average transaction value through targeted upselling, menu optimization, and pairing suggestions.",
    trigger: "kpi_below_target" as const,
    triggerCondition: "cafe_avg_ticket_size < target",
    steps: [
      {
        order: 1,
        action: "Analyze POS data to identify the most common order combinations and underperforming add-on categories",
        owner: "cafe_cafe_manager",
        expectedOutcome: "Top upsell opportunities identified by product and daypart",
        timelineHours: 1,
      },
      {
        order: 2,
        action: "Train all staff on two-step upsell script: suggest a food pairing and a size upgrade for every beverage order",
        owner: "cafe_head_barista",
        expectedOutcome: "Staff consistently offering upsell suggestions at point of order",
        timelineHours: 1,
      },
      {
        order: 3,
        action: "Update menu board and digital displays to highlight high-margin combos and seasonal add-ons",
        owner: "cafe_marketing_coordinator",
        expectedOutcome: "Visual merchandising aligned with upsell strategy",
        timelineHours: 2,
      },
      {
        order: 4,
        action: "Monitor average ticket size daily for two weeks and celebrate progress with staff",
        owner: "cafe_shift_supervisor",
        expectedOutcome: "Average ticket size increasing week over week toward target",
        timelineHours: 0.5,
      },
    ],
    relatedDecisionKeys: ["cafe_add_menu_item", "cafe_raise_prices"],
    estimatedTotalHours: 4.5,
  },
];

export function seedPlaybooks(): void {
  for (const playbook of playbooks) {
    playbookRegistry.register(playbook);
  }
}
