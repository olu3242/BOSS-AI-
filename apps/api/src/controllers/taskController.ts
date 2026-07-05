import type { TaskService } from "../services/taskService.js";

export function createTaskController(service: TaskService) {
  return {
    create: (orgId: string, businessId: string, input: Parameters<TaskService["create"]>[2], actorId: string) =>
      service.create(orgId, businessId, input, actorId),

    get: (orgId: string, id: string) => service.get(orgId, id),

    list: (orgId: string, businessId: string) => service.list(orgId, businessId),

    listChildren: (orgId: string, parentTaskId: string) => service.listChildren(orgId, parentTaskId),

    update: (orgId: string, id: string, patch: Parameters<TaskService["update"]>[2], actorId: string) =>
      service.update(orgId, id, patch, actorId),

    delete: (orgId: string, id: string, actorId: string) => service.delete(orgId, id, actorId),
  };
}
