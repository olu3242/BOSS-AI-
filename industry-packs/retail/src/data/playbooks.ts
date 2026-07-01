import { playbookRegistry } from "@boss/registries";

const playbooks = [
  {
    key: "retail_inventory_clearance_playbook",
    label: "Inventory Clearance Playbook",
    description: "Structured markdown cadence to clear slow-moving and aging inventory before it becomes dead stock.",
    trigger: "constraint_detected" as const,
    triggerCondition: "retail_slow_moving_inventory",
    steps: [
      {
        order: 1,
        action: "Pull aged inventory report showing all SKUs with sell-through below 50% for 60+ days",
        owner: "retail_inventory_manager",
        expectedOutcome: "Prioritized list of slow-moving SKUs by total value at risk",
        timelineHours: 1,
      },
      {
        order: 2,
        action: "Apply first markdown of 20% off to all SKUs on the aged list and update pricing in POS",
        owner: "retail_store_manager",
        expectedOutcome: "Discounted items repriced and signage updated within 24 hours",
        timelineHours: 2,
      },
      {
        order: 3,
        action: "Move marked-down items to endcap, clearance rack, or high-visibility zone",
        owner: "retail_merchandising_coordinator",
        expectedOutcome: "Clearance items prominent; conversion on marked-down SKUs improves",
        timelineHours: 2,
      },
      {
        order: 4,
        action: "After 2 weeks with less than 20% sell-through, apply second markdown of 40% off",
        owner: "retail_store_manager",
        expectedOutcome: "Deepened discount drives final clearance volume",
        timelineHours: 1,
      },
      {
        order: 5,
        action: "After 4 weeks total, donate, liquidate, or destroy remaining unsold units",
        owner: "retail_store_manager",
        expectedOutcome: "Inventory cleared; space and capital freed for better-performing product",
        timelineHours: 1,
      },
    ],
    relatedDecisionKeys: ["retail_clear_slow_moving_inventory"],
    estimatedTotalHours: 7,
  },
  {
    key: "retail_shrinkage_reduction_playbook",
    label: "Shrinkage Reduction Playbook",
    description: "Investigation and control protocol to identify shrinkage sources and bring the rate back below 1.5%.",
    trigger: "constraint_detected" as const,
    triggerCondition: "retail_high_shrinkage",
    steps: [
      {
        order: 1,
        action: "Conduct a surprise cycle count on the top-20 highest-value SKUs to verify on-hand accuracy",
        owner: "retail_loss_prevention_coordinator",
        expectedOutcome: "Discrepancy magnitude and affected categories identified",
        timelineHours: 3,
      },
      {
        order: 2,
        action: "Pull 30-day POS exception report for voids, discounts, and refund anomalies by cashier",
        owner: "retail_loss_prevention_coordinator",
        expectedOutcome: "Patterns of potential internal theft or administrative error surfaced",
        timelineHours: 2,
      },
      {
        order: 3,
        action: "Audit receiving process: verify that all deliveries are checked against POs before signing",
        owner: "retail_inventory_manager",
        expectedOutcome: "Receiving gap (vendor short-shipping or billing errors) identified if present",
        timelineHours: 2,
      },
      {
        order: 4,
        action: "Retrain all staff on loss prevention protocols: bag checks, fitting room limits, and receipt verification",
        owner: "retail_store_manager",
        expectedOutcome: "Staff awareness elevated; deterrence improved",
        timelineHours: 2,
      },
      {
        order: 5,
        action: "Schedule weekly cycle counts on at-risk categories for next 60 days and monitor shrinkage rate",
        owner: "retail_loss_prevention_coordinator",
        expectedOutcome: "Shrinkage rate trending toward target within 60 days",
        timelineHours: 1,
      },
    ],
    relatedDecisionKeys: ["retail_reduce_shrinkage"],
    estimatedTotalHours: 10,
  },
  {
    key: "retail_conversion_boost_playbook",
    label: "Conversion Rate Playbook",
    description: "Systematic approach to turning more visitors into buyers through better merchandising, engagement, and promotional strategies.",
    trigger: "kpi_below_target" as const,
    triggerCondition: "retail_conversion_rate < 25%",
    steps: [
      {
        order: 1,
        action: "Audit greeting and engagement behavior: time associates to first customer contact during a one-hour observation",
        owner: "retail_sales_floor_lead",
        expectedOutcome: "Baseline customer engagement quality measured",
        timelineHours: 1,
      },
      {
        order: 2,
        action: "Review and refresh entrance and high-traffic floor areas with best-selling and promotional product",
        owner: "retail_merchandising_coordinator",
        expectedOutcome: "High-demand items at eye level and near-entrance; visual appeal improved",
        timelineHours: 3,
      },
      {
        order: 3,
        action: "Run a two-week introductory offer for new customers or time-limited bundle discount",
        owner: "retail_store_manager",
        expectedOutcome: "Promotional offer converts hesitant buyers; offer performance tracked",
        timelineHours: 2,
      },
      {
        order: 4,
        action: "Debrief floor team weekly on conversion rate trends and share top 3 winning customer conversations",
        owner: "retail_sales_floor_lead",
        expectedOutcome: "Team learns from best practices; engagement consistency improves",
        timelineHours: 1,
      },
    ],
    relatedDecisionKeys: ["retail_improve_conversion_rate", "retail_increase_avg_transaction"],
    estimatedTotalHours: 7,
  },
  {
    key: "retail_loyalty_growth_playbook",
    label: "Loyalty & Repeat Customer Playbook",
    description: "Drive customer return rate by activating the loyalty program, improving post-purchase follow-up, and rewarding VIP customers.",
    trigger: "kpi_below_target" as const,
    triggerCondition: "retail_customer_return_rate < 30%",
    steps: [
      {
        order: 1,
        action: "Set daily loyalty enrollment target per associate and track at the register level",
        owner: "retail_customer_experience_manager",
        expectedOutcome: "Enrollment rate increases; data capture improves",
        timelineHours: 1,
      },
      {
        order: 2,
        action: "Send a 'welcome back' offer to customers who haven't purchased in 60–90 days",
        owner: "retail_customer_experience_manager",
        expectedOutcome: "Lapsed customers reactivated; reactivation conversion tracked",
        timelineHours: 2,
      },
      {
        order: 3,
        action: "Identify and recognize the top-20 customers by spend with a VIP event or exclusive preview",
        owner: "retail_store_manager",
        expectedOutcome: "VIP customers feel valued; spend and visit frequency increases",
        timelineHours: 4,
      },
      {
        order: 4,
        action: "Review repeat purchase rate monthly and tie loyalty campaign performance to customer return rate trend",
        owner: "retail_customer_experience_manager",
        expectedOutcome: "Clear line of sight between loyalty actions and retention metric",
        timelineHours: 1,
      },
    ],
    relatedDecisionKeys: ["retail_grow_repeat_customers"],
    estimatedTotalHours: 8,
  },
];

export function seedPlaybooks(): void {
  for (const playbook of playbooks) {
    playbookRegistry.register(playbook);
  }
}
