import type { BusinessDnaService } from "../services/businessDnaService.js";

export function createBusinessDnaController(service: BusinessDnaService) {
  return {
    generate: (orgId: string, businessId: string, businessMriId: string) =>
      service.generate(orgId, businessId, businessMriId),
    getDna: (orgId: string, businessId: string) => service.getDna(orgId, businessId),
  };
}
