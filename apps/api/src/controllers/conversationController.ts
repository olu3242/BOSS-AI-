import type { ConversationService } from "../services/conversationService.js";

export function createConversationController(service: ConversationService) {
  return {
    create: (orgId: string, businessId: string, input: Parameters<ConversationService["create"]>[2], actorId: string) =>
      service.create(orgId, businessId, input, actorId),

    get: (orgId: string, id: string) => service.get(orgId, id),

    list: (orgId: string, businessId: string, limit?: number) => service.list(orgId, businessId, limit),

    listByCustomer: (orgId: string, customerId: string) => service.listByCustomer(orgId, customerId),

    update: (orgId: string, id: string, patch: Parameters<ConversationService["update"]>[2], actorId: string) =>
      service.update(orgId, id, patch, actorId),

    delete: (orgId: string, id: string, actorId: string) => service.delete(orgId, id, actorId),
  };
}
