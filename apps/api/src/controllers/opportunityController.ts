import type { OpportunityService } from "../services/opportunityService.js";

export function createOpportunityController(service: OpportunityService) {
  return {
    create: (orgId: string, businessId: string, input: Parameters<OpportunityService["create"]>[2], actorId: string) =>
      service.create(orgId, businessId, input, actorId),

    get: (orgId: string, id: string) => service.get(orgId, id),

    list: (orgId: string, businessId: string) => service.list(orgId, businessId),

    listByStage: (orgId: string, businessId: string, stage: Parameters<OpportunityService["listByStage"]>[2]) =>
      service.listByStage(orgId, businessId, stage),

    update: (orgId: string, id: string, patch: Parameters<OpportunityService["update"]>[2], actorId: string) =>
      service.update(orgId, id, patch, actorId),

    delete: (orgId: string, id: string, actorId: string) => service.delete(orgId, id, actorId),
  };
}
