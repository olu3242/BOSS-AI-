import { automationCenterRegistry } from "@boss/registries";

export function seedAutomationCenter(): void {
  automationCenterRegistry.register({
    key: "auto_loop_on_constraint",
    label: "Auto Operating Loop on Constraint Detected",
    description: "Automatically run the full 8-phase operating loop when a new high-priority constraint is detected.",
    category: "proactive_intelligence",
    ruleSteps: [
      {
        triggerType: "constraint_detected",
        triggerCondition: "priority === 'critical' || priority === 'high'",
        actionType: "run_operating_loop",
        actionConfig: { phases: "all" },
      },
    ],
    requiresApproval: false,
    estimatedTimeSavedMinutesPerWeek: 120,
    relatedProviderKeys: [],
  });

  automationCenterRegistry.register({
    key: "auto_notify_on_decision",
    label: "Notify Owner on Decision Generated",
    description: "Send a notification when a new business decision is generated and ready for review.",
    category: "decision_pipeline",
    ruleSteps: [
      {
        triggerType: "recommendation_generated",
        triggerCondition: "confidenceScore >= 0.75",
        actionType: "send_notification",
        actionConfig: { channel: "in_app", priority: "high" },
      },
    ],
    requiresApproval: false,
    estimatedTimeSavedMinutesPerWeek: 30,
    relatedProviderKeys: ["slack", "email"],
  });

  automationCenterRegistry.register({
    key: "auto_plan_on_approval",
    label: "Auto-Create Execution Plan on Decision Approved",
    description: "Automatically create an execution plan when a decision is approved, bypassing the manual plan creation step.",
    category: "decision_pipeline",
    ruleSteps: [
      {
        triggerType: "decision_approved",
        triggerCondition: "confidenceScore >= 0.8",
        actionType: "create_workflow",
        actionConfig: { workflowKey: "execution_plan_creation" },
      },
    ],
    requiresApproval: false,
    estimatedTimeSavedMinutesPerWeek: 60,
    relatedProviderKeys: [],
  });

  automationCenterRegistry.register({
    key: "auto_loop_daily",
    label: "Daily Operating Loop",
    description: "Run the full 8-phase business operating loop every day at business start time.",
    category: "scheduled_intelligence",
    ruleSteps: [
      {
        triggerType: "scheduled",
        triggerCondition: "cron: 0 9 * * 1-5",
        actionType: "run_operating_loop",
        actionConfig: { phases: "all", autoApproveThreshold: "0.75" },
      },
    ],
    requiresApproval: false,
    estimatedTimeSavedMinutesPerWeek: 300,
    relatedProviderKeys: [],
  });

  automationCenterRegistry.register({
    key: "alert_on_health_drop",
    label: "Alert on Health Score Drop",
    description: "Trigger a root cause analysis and executive notification when overall health score drops more than 10 points.",
    category: "health_monitoring",
    ruleSteps: [
      {
        triggerType: "health_score_drop",
        triggerCondition: "delta >= 10",
        actionType: "generate_decision",
        actionConfig: { priority: "critical" },
      },
      {
        triggerType: "health_score_drop",
        triggerCondition: "delta >= 10",
        actionType: "send_notification",
        actionConfig: { channel: "in_app", priority: "critical" },
      },
    ],
    requiresApproval: false,
    estimatedTimeSavedMinutesPerWeek: 90,
    relatedProviderKeys: ["slack", "email"],
  });
}
