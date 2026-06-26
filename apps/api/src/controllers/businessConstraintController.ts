import type { BusinessConstraintService } from "../services/businessConstraintService.js";

export function createBusinessConstraintController(service: BusinessConstraintService) {
  return {
    analyze: (orgId: string, businessId: string, businessMriId: string) =>
      service.analyze(orgId, businessId, businessMriId),
    list: (orgId: string, businessId: string) => service.list(orgId, businessId),
    getPriorities: (orgId: string, businessId: string) => service.getPriorities(orgId, businessId),
    dismiss: (orgId: string, constraintId: string) => service.dismiss(orgId, constraintId),
  };
}
