import type { WorkflowService } from "../services/workflowService.js";

export function createWorkflowController(service: WorkflowService) {
  return {
    create: (orgId: string, businessId: string, input: Parameters<WorkflowService["create"]>[2]) =>
      service.create(orgId, businessId, input),

    getById: (orgId: string, id: string) => service.getById(orgId, id),

    list: (orgId: string, businessId: string) => service.list(orgId, businessId),

    listByTriggerEvent: (orgId: string, triggerEvent: string) =>
      service.listByTriggerEvent(orgId, triggerEvent),

    update: (orgId: string, id: string, patch: Parameters<WorkflowService["update"]>[2]) =>
      service.update(orgId, id, patch),

    publish: (orgId: string, id: string) => service.publish(orgId, id),

    archive: (orgId: string, id: string) => service.archive(orgId, id),

    delete: (orgId: string, id: string) => service.delete(orgId, id),
  };
}
