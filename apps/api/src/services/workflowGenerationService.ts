import { nowIso } from "@boss/shared";
import { generateWorkflowGraph } from "@boss/mcp";
import type { WorkflowExecution } from "@boss/types";
import type { RepositoryContainer } from "../container.js";
import type { LoopRuntimeService } from "./loopRuntimeService.js";

export interface WorkflowGenerationService {
  generateAndExecute(orgId: string, businessId: string, recommendationId: string): Promise<WorkflowExecution>;
}

export function createWorkflowGenerationService(
  repos: RepositoryContainer,
  loopRuntime: LoopRuntimeService
): WorkflowGenerationService {
  return {
    async generateAndExecute(orgId, businessId, recommendationId) {
      const recommendation = await repos.businessRecommendations.findById(orgId, recommendationId);
      if (!recommendation) {
        throw new Error(`Recommendation ${recommendationId} not found`);
      }

      const graph = generateWorkflowGraph(recommendation);

      // Idempotency: skip if a non-terminal execution already exists for this workflowKey
      const existing = await repos.workflowExecutions.listByBusinessId(orgId, businessId);
      const active = existing.find(
        (e) =>
          e.workflowKey === graph.workflowKey &&
          !["completed", "failed", "cancelled", "rolled_back", "timed_out"].includes(e.state)
      );
      if (active) return active;

      await repos.businessTimeline.append({
        orgId,
        businessId,
        type: "workflow_generated",
        description: `Generated executable workflow "${graph.workflowKey}" from recommendation`,
        metadata: { recommendationId, workflowKey: graph.workflowKey, stepCount: graph.steps.length },
        occurredAt: nowIso(),
      });

      await repos.eventBus.publish({
        type: "workflow.generated",
        payload: { orgId, businessId, recommendationId, workflowKey: graph.workflowKey, stepCount: graph.steps.length },
        occurredAt: nowIso(),
      });

      const execution = await loopRuntime.execute(orgId, businessId, graph.workflowKey, graph.steps);

      await repos.eventBus.publish({
        type: `workflow.${execution.state}`,
        payload: { orgId, businessId, recommendationId, workflowExecutionId: execution.id },
        occurredAt: nowIso(),
      });

      return execution;
    },
  };
}
