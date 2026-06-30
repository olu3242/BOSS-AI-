import type { BusinessDecision } from "@boss/types";
import { planningRegistry } from "@boss/registries";

export interface ExecutionTask {
  id: string;
  action: string;
  owner: string;
  dueDateOffset: number;
  dependsOn: string[];
  expectedOutcome: string;
}

export interface ExecutionMilestone {
  key: string;
  label: string;
  dayOffset: number;
  successCriteria: string;
}

export interface ExecutionPlan {
  decisionId: string;
  planKey: string;
  durationDays: number;
  tasks: ExecutionTask[];
  milestones: ExecutionMilestone[];
  ownerRole: string;
  successMetrics: string[];
  rollbackStrategy: string;
  createdAt: string;
}

const DECISION_CATEGORY_TO_PLAN_KEY: Record<string, string> = {
  revenue_optimization: "revenue_recovery_plan",
  customer_retention: "customer_retention_plan",
  cost_optimization: "operational_efficiency_plan",
  operational: "operational_efficiency_plan",
  strategic: "revenue_recovery_plan",
  financial: "revenue_recovery_plan",
  marketing: "revenue_recovery_plan",
  technology: "operational_efficiency_plan",
};

function deriveTasksFromDecision(decision: BusinessDecision): ExecutionTask[] {
  const tasks: ExecutionTask[] = [];

  if (decision.selectedOptionKey) {
    tasks.push({
      id: `task_configure_${decision.id}`,
      action: `Configure and activate: ${decision.selectedOptionKey.replace(/_/g, " ")}`,
      owner: "owner",
      dueDateOffset: 3,
      dependsOn: [],
      expectedOutcome: "Implementation ready and tested.",
    });
    tasks.push({
      id: `task_monitor_${decision.id}`,
      action: `Monitor KPI impact of decision: ${decision.objective}`,
      owner: "operations_manager",
      dueDateOffset: 14,
      dependsOn: [`task_configure_${decision.id}`],
      expectedOutcome: "KPI baseline established; early signal captured.",
    });
    tasks.push({
      id: `task_review_${decision.id}`,
      action: `Review and optimize: ${decision.objective}`,
      owner: "owner",
      dueDateOffset: 28,
      dependsOn: [`task_monitor_${decision.id}`],
      expectedOutcome: "Performance validated against success metrics.",
    });
  } else {
    tasks.push({
      id: `task_evaluate_${decision.id}`,
      action: `Evaluate decision options for: ${decision.objective}`,
      owner: "owner",
      dueDateOffset: 5,
      dependsOn: [],
      expectedOutcome: "Option selected and approved.",
    });
  }

  return tasks;
}

export function createExecutionPlan(decision: BusinessDecision, createdAt: string): ExecutionPlan {
  const category = decision.decisionType ?? "operational";
  const planKey = DECISION_CATEGORY_TO_PLAN_KEY[category] ?? "operational_efficiency_plan";
  const planTemplate = planningRegistry.get(planKey);

  const tasks = deriveTasksFromDecision(decision);
  const milestones: ExecutionMilestone[] = planTemplate
    ? planTemplate.milestones.map((m) => ({
        key: m.key,
        label: m.label,
        dayOffset: m.dayOffset,
        successCriteria: m.successCriteria,
      }))
    : [
        { key: "start", label: "Execution Start", dayOffset: 0, successCriteria: "Tasks initiated." },
        { key: "completion", label: "Execution Complete", dayOffset: 30, successCriteria: "All tasks completed." },
      ];

  const successMetrics = [
    `${decision.objective} achieved`,
    `Confidence score ≥ ${Math.round(decision.confidenceScore * 100)}%`,
    `Expected ROI: ${decision.expectedRoi > 0 ? `+${decision.expectedRoi}%` : `${decision.expectedRoi}%`}`,
  ];

  return {
    decisionId: decision.id,
    planKey,
    durationDays: planTemplate?.defaultDurationDays ?? 30,
    tasks,
    milestones,
    ownerRole: planTemplate?.defaultOwnerRole ?? "owner",
    successMetrics,
    rollbackStrategy: planTemplate?.rollbackStrategyTemplate ?? "Revert changes and restore previous state within 48 hours.",
    createdAt,
  };
}
