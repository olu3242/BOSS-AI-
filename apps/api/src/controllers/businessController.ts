import type { BusinessProfileService, CreateBusinessInput } from "../services/businessProfileService.js";

export function createBusinessController(service: BusinessProfileService) {
  return {
    create: (input: CreateBusinessInput) => service.createBusiness(input),
    getProfile: (orgId: string, businessId: string) => service.getProfile(orgId, businessId),
    list: (orgId: string) => service.list(orgId),
  };
}
