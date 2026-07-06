import type { WorkflowExecutionService } from "../services/workflowExecutionService.js";
import type { StepEntry } from "@boss/loop";

export function createWorkflowExecutionController(service: WorkflowExecutionService) {
  return {
    list: (orgId: string, businessId: string) =>
      service.list(orgId, businessId),

    get: (orgId: string, businessId: string, executionId: string) =>
      service.get(orgId, businessId, executionId),

    cancel: (orgId: string, businessId: string, executionId: string) =>
      service.cancel(orgId, businessId, executionId),

    retry: (orgId: string, businessId: string, executionId: string, steps: StepEntry[]) =>
      service.retry(orgId, businessId, executionId, steps),

    approveCheckpoint: (orgId: string, businessId: string, executionId: string, steps: StepEntry[]) =>
      service.approveCheckpoint(orgId, businessId, executionId, steps),

    rejectCheckpoint: (orgId: string, businessId: string, executionId: string) =>
      service.rejectCheckpoint(orgId, businessId, executionId),

    listDeadLetters: (orgId: string, businessId: string) =>
      service.listDeadLetters(orgId, businessId),
  };
}
