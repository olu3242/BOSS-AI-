import type { AnalyticsService } from "../services/analyticsService.js";

export function createAnalyticsController(service: AnalyticsService) {
  return {
    getBusinessAnalytics: (orgId: string, businessId: string) =>
      service.getBusinessAnalytics(orgId, businessId),
  };
}
