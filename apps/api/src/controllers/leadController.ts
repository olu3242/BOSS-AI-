import type { LeadService } from "../services/leadService.js";

export function createLeadController(service: LeadService) {
  return {
    create: (orgId: string, businessId: string, input: Parameters<LeadService["create"]>[2]) =>
      service.create(orgId, businessId, input),

    get: (orgId: string, id: string) => service.get(orgId, id),

    list: (orgId: string, businessId: string) => service.list(orgId, businessId),

    search: (orgId: string, businessId: string, query: string) =>
      service.search(orgId, businessId, query),

    update: (orgId: string, id: string, patch: Parameters<LeadService["update"]>[2]) =>
      service.update(orgId, id, patch),

    qualify: (orgId: string, id: string, actor: string) => service.qualify(orgId, id, actor),

    assign: (orgId: string, id: string, assignedTo: string) => service.assign(orgId, id, assignedTo),

    convert: (orgId: string, id: string, convertedCustomerId: string) =>
      service.convert(orgId, id, convertedCustomerId),

    markLost: (orgId: string, id: string) => service.markLost(orgId, id),

    delete: (orgId: string, id: string) => service.delete(orgId, id),
  };
}
