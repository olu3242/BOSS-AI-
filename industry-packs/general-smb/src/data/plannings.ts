import { planningRegistry } from "@boss/registries";

export function seedPlannings(): void {
  planningRegistry.register({
    key: "revenue_recovery_plan",
    label: "Revenue Recovery Plan",
    description: "Structured 30-day plan to recover declining revenue through lead generation, conversion optimization, and retention tactics.",
    decisionCategory: "revenue_optimization",
    defaultDurationDays: 30,
    milestones: [
      {
        key: "kickoff",
        label: "Plan Kickoff",
        type: "kickoff",
        dayOffset: 0,
        successCriteria: "All stakeholders briefed, tools configured, baseline KPIs recorded.",
      },
      {
        key: "midpoint_review",
        label: "Mid-Plan Review",
        type: "midpoint",
        dayOffset: 15,
        successCriteria: "Revenue trend reversed or holding steady; at least 2 tactics active.",
      },
      {
        key: "completion",
        label: "Plan Completion",
        type: "completion",
        dayOffset: 30,
        successCriteria: "Revenue KPI improved by ≥5% from baseline.",
      },
    ],
    defaultOwnerRole: "owner",
    requiredCapabilityKeys: ["crm_integration", "email_automation"],
    rollbackStrategyTemplate: "Revert to previous pricing tier and restore original lead follow-up cadence within 48 hours.",
  });

  planningRegistry.register({
    key: "customer_retention_plan",
    label: "Customer Retention Improvement Plan",
    description: "60-day plan to reduce churn by improving onboarding, support response time, and loyalty incentives.",
    decisionCategory: "customer_retention",
    defaultDurationDays: 60,
    milestones: [
      {
        key: "kickoff",
        label: "Retention Kickoff",
        type: "kickoff",
        dayOffset: 0,
        successCriteria: "Churn baseline established, at-risk segments identified.",
      },
      {
        key: "first_review",
        label: "First Review",
        type: "review",
        dayOffset: 20,
        successCriteria: "Outreach to at-risk customers initiated; NPS survey sent.",
      },
      {
        key: "midpoint",
        label: "Midpoint Assessment",
        type: "midpoint",
        dayOffset: 40,
        successCriteria: "Churn rate holding or declining vs. baseline.",
      },
      {
        key: "completion",
        label: "Retention Plan Completion",
        type: "completion",
        dayOffset: 60,
        successCriteria: "Customer retention rate improved by ≥3% from baseline.",
      },
    ],
    defaultOwnerRole: "operations_manager",
    requiredCapabilityKeys: ["customer_success_tracking", "email_automation"],
    rollbackStrategyTemplate: "Suspend loyalty program changes and restore original support SLA targets within 24 hours.",
  });

  planningRegistry.register({
    key: "operational_efficiency_plan",
    label: "Operational Efficiency Plan",
    description: "45-day plan to streamline operations, reduce manual work, and cut overhead costs through automation.",
    decisionCategory: "cost_optimization",
    defaultDurationDays: 45,
    milestones: [
      {
        key: "kickoff",
        label: "Efficiency Kickoff",
        type: "kickoff",
        dayOffset: 0,
        successCriteria: "Manual process inventory complete; automation targets identified.",
      },
      {
        key: "implementation",
        label: "Automation Implementation",
        type: "midpoint",
        dayOffset: 22,
        successCriteria: "At least 3 workflows automated; time savings being measured.",
      },
      {
        key: "measurement",
        label: "Impact Measurement",
        type: "measurement",
        dayOffset: 38,
        successCriteria: "Efficiency metrics collected and compared to baseline.",
      },
      {
        key: "completion",
        label: "Efficiency Plan Completion",
        type: "completion",
        dayOffset: 45,
        successCriteria: "Operational overhead reduced by ≥10% or 5+ hours/week saved.",
      },
    ],
    defaultOwnerRole: "operations_manager",
    requiredCapabilityKeys: ["workflow_automation", "task_management"],
    rollbackStrategyTemplate: "Disable new automations and revert to manual process within 24 hours.",
  });
}
