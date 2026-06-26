import type { BusinessDNA } from "@boss/types";
import type { BusinessCapabilityService } from "../services/businessCapabilityService.js";

export function createBusinessCapabilityController(service: BusinessCapabilityService) {
  return {
    evaluate: (orgId: string, businessId: string, businessMriId: string, dna: BusinessDNA) =>
      service.evaluate(orgId, businessId, businessMriId, dna),
    list: (orgId: string, businessId: string) => service.list(orgId, businessId),
  };
}
