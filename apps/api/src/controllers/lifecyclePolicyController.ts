import type { LifecyclePolicyService } from "../services/lifecyclePolicyService.js";

export function createLifecyclePolicyController(service: LifecyclePolicyService) {
  return {
    create: (orgId: string, businessId: string, input: Parameters<LifecyclePolicyService["create"]>[2]) =>
      service.create(orgId, businessId, input),

    getById: (orgId: string, id: string) => service.getById(orgId, id),

    list: (orgId: string, businessId: string) => service.list(orgId, businessId),

    listByEvent: (orgId: string, businessId: string, fromEvent: string) =>
      service.listByEvent(orgId, businessId, fromEvent),

    update: (orgId: string, id: string, patch: Parameters<LifecyclePolicyService["update"]>[2]) =>
      service.update(orgId, id, patch),

    delete: (orgId: string, id: string) => service.delete(orgId, id),
  };
}
