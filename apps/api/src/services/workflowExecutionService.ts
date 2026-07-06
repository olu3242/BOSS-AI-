import { nowIso } from "@boss/shared";
import type { WorkflowExecutionRepository, TaskExecutionRepository, DeadLetterRepository } from "@boss/db";
import type { WorkflowExecution, TaskExecution, DeadLetterEntry } from "@boss/types";
import { ApiError } from "../http/apiError.js";
import type { LoopRuntimeService } from "./loopRuntimeService.js";
import type { StepEntry } from "@boss/loop";

export interface WorkflowExecutionDetail extends WorkflowExecution {
  steps: TaskExecution[];
}

export interface WorkflowExecutionService {
  list(orgId: string, businessId: string): Promise<WorkflowExecution[]>;
  get(orgId: string, businessId: string, executionId: string): Promise<WorkflowExecutionDetail>;
  cancel(orgId: string, businessId: string, executionId: string): Promise<WorkflowExecution>;
  retry(orgId: string, businessId: string, executionId: string, steps: StepEntry[]): Promise<WorkflowExecution>;
  listDeadLetters(orgId: string, businessId: string): Promise<DeadLetterEntry[]>;
}

export function createWorkflowExecutionService(
  workflowExecutions: WorkflowExecutionRepository,
  taskExecutions: TaskExecutionRepository,
  deadLetters: DeadLetterRepository,
  loopRuntime: LoopRuntimeService
): WorkflowExecutionService {
  return {
    async list(orgId, businessId) {
      return workflowExecutions.listByBusinessId(orgId, businessId);
    },

    async get(orgId, businessId, executionId) {
      const execution = await workflowExecutions.findById(orgId, executionId);
      if (!execution || execution.businessId !== businessId) {
        throw new ApiError(404, "WORKFLOW_EXECUTION_NOT_FOUND", `Workflow execution ${executionId} not found`);
      }
      const steps = await taskExecutions.listByWorkflowExecutionId(orgId, executionId);
      return { ...execution, steps };
    },

    async cancel(orgId, businessId, executionId) {
      const execution = await workflowExecutions.findById(orgId, executionId);
      if (!execution || execution.businessId !== businessId) {
        throw new ApiError(404, "WORKFLOW_EXECUTION_NOT_FOUND", `Workflow execution ${executionId} not found`);
      }
      const terminal: WorkflowExecution["state"][] = ["completed", "failed", "cancelled", "rolled_back", "timed_out"];
      if (terminal.includes(execution.state)) {
        throw new ApiError(409, "WORKFLOW_EXECUTION_TERMINAL", `Cannot cancel a ${execution.state} execution`);
      }
      return workflowExecutions.updateState(
        orgId, executionId, "cancelled",
        execution.currentStepIndex, execution.output, "Cancelled by user", nowIso()
      );
    },

    async retry(orgId, businessId, executionId, steps) {
      const execution = await workflowExecutions.findById(orgId, executionId);
      if (!execution || execution.businessId !== businessId) {
        throw new ApiError(404, "WORKFLOW_EXECUTION_NOT_FOUND", `Workflow execution ${executionId} not found`);
      }
      const retryable: WorkflowExecution["state"][] = ["failed", "cancelled", "timed_out"];
      if (!retryable.includes(execution.state)) {
        throw new ApiError(409, "WORKFLOW_EXECUTION_NOT_RETRYABLE", `Cannot retry a ${execution.state} execution`);
      }
      return loopRuntime.execute(orgId, businessId, execution.workflowKey, steps);
    },

    async listDeadLetters(orgId, businessId) {
      return deadLetters.listByBusinessId(orgId, businessId);
    },
  };
}
