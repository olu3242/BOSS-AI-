import type { BusinessTimelineService } from "../services/businessTimelineService.js";

export function createBusinessTimelineController(service: BusinessTimelineService) {
  return {
    list: (orgId: string, businessId: string) => service.list(orgId, businessId),
  };
}
