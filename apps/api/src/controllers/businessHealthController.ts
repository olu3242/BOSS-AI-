import type { BusinessHealthService } from "../services/businessHealthService.js";

export function createBusinessHealthController(service: BusinessHealthService) {
  return {
    generate: (orgId: string, businessId: string, businessMriId: string) =>
      service.generate(orgId, businessId, businessMriId),
    getHealth: (orgId: string, businessId: string) => service.getHealth(orgId, businessId),
  };
}
