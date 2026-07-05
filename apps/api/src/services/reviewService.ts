import type { CustomerReview, ReviewStatus, ReviewSource } from "@boss/types";
import type { RepositoryContainer } from "../container.js";

export interface ReviewService {
  createReview(orgId: string, businessId: string, input: {
    customerId: string;
    jobId?: string | null;
    rating: number;
    title?: string | null;
    body?: string | null;
    source?: ReviewSource;
  }): Promise<CustomerReview>;

  getReview(orgId: string, reviewId: string): Promise<CustomerReview>;

  respondToReview(orgId: string, reviewId: string, response: string): Promise<CustomerReview>;

  updateStatus(orgId: string, reviewId: string, status: ReviewStatus): Promise<CustomerReview>;

  listByBusiness(orgId: string, businessId: string): Promise<CustomerReview[]>;
}

export function createReviewService(repos: RepositoryContainer): ReviewService {
  return {
    async createReview(orgId, businessId, input) {
      if (input.rating < 1 || input.rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }
      const review = await repos.reviews.create({
        orgId,
        businessId,
        customerId: input.customerId,
        jobId: input.jobId ?? null,
        rating: input.rating,
        title: input.title ?? null,
        body: input.body ?? null,
        status: 'pending',
        source: input.source ?? 'internal',
        response: null,
        respondedAt: null,
      });

      await repos.eventBus.publish({
        type: "review.received",
        payload: { orgId, businessId, reviewId: review.id, rating: review.rating },
        occurredAt: new Date().toISOString(),
      });

      return review;
    },

    async getReview(orgId, reviewId) {
      const r = await repos.reviews.findById(orgId, reviewId);
      if (!r) throw new Error(`Review ${reviewId} not found`);
      return r;
    },

    async respondToReview(orgId, reviewId, response) {
      const now = new Date().toISOString();
      return repos.reviews.update(orgId, reviewId, {
        response,
        respondedAt: now,
      });
    },

    async updateStatus(orgId, reviewId, status) {
      return repos.reviews.update(orgId, reviewId, { status });
    },

    async listByBusiness(orgId, businessId) {
      return repos.reviews.listByBusiness(orgId, businessId);
    },
  };
}
