import type { EstimateService } from "../services/estimateService.js";

export function createEstimateController(service: EstimateService) {
  return {
    create: (orgId: string, businessId: string, input: Parameters<EstimateService["create"]>[2], actorId: string) =>
      service.create(orgId, businessId, input, actorId),

    get: (orgId: string, id: string) => service.get(orgId, id),

    list: (orgId: string, businessId: string) => service.list(orgId, businessId),

    update: (orgId: string, id: string, patch: Parameters<EstimateService["update"]>[2], actorId: string) =>
      service.update(orgId, id, patch, actorId),

    send: (orgId: string, id: string, actorId: string) => service.send(orgId, id, actorId),

    accept: (orgId: string, id: string, actorId: string) => service.accept(orgId, id, actorId),

    decline: (orgId: string, id: string, actorId: string) => service.decline(orgId, id, actorId),

    convert: (orgId: string, id: string, invoiceId: string, actorId: string) =>
      service.convert(orgId, id, invoiceId, actorId),

    delete: (orgId: string, id: string, actorId: string) => service.delete(orgId, id, actorId),

    markViewed: (orgId: string, id: string) => service.markViewed(orgId, id),

    checkExpiry: (orgId: string, businessId: string) => service.checkExpiry(orgId, businessId),
  };
}
