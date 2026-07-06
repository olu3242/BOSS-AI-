import type { WorkflowRunService } from "../services/workflowRunService.js";

export function createWorkflowRunController(service: WorkflowRunService) {
  return {
    create: (orgId: string, businessId: string, input: Parameters<WorkflowRunService["create"]>[2]) =>
      service.create(orgId, businessId, input),

    getById: (orgId: string, id: string) => service.getById(orgId, id),

    listByBusiness: (orgId: string, businessId: string) => service.listByBusiness(orgId, businessId),

    listByWorkflow: (orgId: string, workflowId: string) => service.listByWorkflow(orgId, workflowId),

    listByObject: (orgId: string, businessObjectType: string, businessObjectId: string) =>
      service.listByObject(orgId, businessObjectType, businessObjectId),

    complete: (orgId: string, id: string, result: Record<string, unknown>, durationMs: number) =>
      service.complete(orgId, id, result, durationMs),

    fail: (orgId: string, id: string, errorMessage: string, durationMs: number) =>
      service.fail(orgId, id, errorMessage, durationMs),

    cancel: (orgId: string, id: string) => service.cancel(orgId, id),
  };
}
