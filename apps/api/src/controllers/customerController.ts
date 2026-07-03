import type { CustomerService } from "../services/customerService.js";

export function createCustomerController(service: CustomerService) {
  return {
    create: (orgId: string, businessId: string, input: Parameters<CustomerService["create"]>[2]) =>
      service.create(orgId, businessId, input),

    get: (orgId: string, id: string) => service.get(orgId, id),

    list: (orgId: string, businessId: string) => service.list(orgId, businessId),

    search: (orgId: string, businessId: string, query: string) =>
      service.search(orgId, businessId, query),

    update: (orgId: string, id: string, patch: Parameters<CustomerService["update"]>[2]) =>
      service.update(orgId, id, patch),

    delete: (orgId: string, id: string) => service.delete(orgId, id),

    addInteraction: (orgId: string, businessId: string, customerId: string, input: Parameters<CustomerService["addInteraction"]>[3]) =>
      service.addInteraction(orgId, businessId, customerId, input),

    listInteractions: (orgId: string, customerId: string) =>
      service.listInteractions(orgId, customerId),
  };
}
