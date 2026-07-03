import type { ReviewService } from "../services/reviewService.js";
import type { ReviewStatus } from "@boss/types";

export function createReviewController(service: ReviewService) {
  return {
    list: (orgId: string, businessId: string) => service.listByBusiness(orgId, businessId),
    get: (orgId: string, reviewId: string) => service.getReview(orgId, reviewId),
    create: (orgId: string, businessId: string, input: Parameters<ReviewService["createReview"]>[2]) =>
      service.createReview(orgId, businessId, input),
    respond: (orgId: string, reviewId: string, response: string) =>
      service.respondToReview(orgId, reviewId, response),
    updateStatus: (orgId: string, reviewId: string, status: ReviewStatus) =>
      service.updateStatus(orgId, reviewId, status),
  };
}
