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

    listDeadLetters: (orgId: string, businessId: string) =>
      service.listDeadLetters(orgId, businessId),
  };
}
