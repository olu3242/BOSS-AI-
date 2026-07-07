import type { StaffService } from "../services/staffService.js";

export function createStaffController(service: StaffService) {
  return {
    create: (orgId: string, businessId: string, input: Parameters<StaffService["create"]>[2], actorId: string) =>
      service.create(orgId, businessId, input, actorId),

    get: (orgId: string, id: string) => service.get(orgId, id),

    list: (orgId: string, businessId: string) => service.list(orgId, businessId),

    update: (orgId: string, id: string, patch: Parameters<StaffService["update"]>[2], actorId: string) =>
      service.update(orgId, id, patch, actorId),

    delete: (orgId: string, id: string, actorId: string) => service.delete(orgId, id, actorId),
  };
}
