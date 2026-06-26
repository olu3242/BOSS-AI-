import type { BusinessRecommendationService } from "../services/businessRecommendationService.js";

export function createBusinessRecommendationController(service: BusinessRecommendationService) {
  return {
    analyze: (orgId: string, businessId: string) => service.analyze(orgId, businessId),
    list: (orgId: string, businessId: string) => service.list(orgId, businessId),
    getPriorities: (orgId: string, businessId: string) => service.getPriorities(orgId, businessId),
    getRoadmap: (orgId: string, businessId: string) => service.getRoadmap(orgId, businessId),
    dismiss: (orgId: string, recommendationId: string) => service.dismiss(orgId, recommendationId),
    approve: (orgId: string, recommendationId: string) => service.approve(orgId, recommendationId),
  };
}
