import type { BusinessRecommendation, TaskType } from "@boss/types";

/**
 * Structurally identical to @boss/loop's StepSpec, defined independently
 * here because MCP must never import from Loop (mcp-never-imports-loop).
 * Loop accepts this shape at the call site without any adapter.
 */
export interface GeneratedWorkflowStep {
  stepKey: string;
  taskType: TaskType;
  input: Record<string, unknown>;
  maxRetries?: number;
}

export interface GeneratedWorkflowGraph {
  workflowKey: string;
  steps: GeneratedWorkflowStep[];
}

/**
 * Transforms an approved recommendation into an executable step graph.
 * One "tool" step per related capability — each capability resolution,
 * permission check, and execution is still handled entirely by the Tool
 * Fabric at run time; this function only declares what to run, never runs
 * anything itself.
 */
export function generateWorkflowGraph(recommendation: BusinessRecommendation): GeneratedWorkflowGraph {
  const steps: GeneratedWorkflowStep[] = recommendation.relatedCapabilities.map((capabilityKey, index) => ({
    stepKey: `${recommendation.definitionKey}_${capabilityKey}_${index}`,
    taskType: "tool",
    input: {
      orgId: recommendation.orgId,
      businessId: recommendation.businessId,
      capabilityKey,
      roleKey: "system_automation",
      requestedBy: "workflow_generator",
      recommendationId: recommendation.id,
    },
    maxRetries: 1,
  }));

  return {
    workflowKey: `recommendation_${recommendation.definitionKey}`,
    steps,
  };
}
