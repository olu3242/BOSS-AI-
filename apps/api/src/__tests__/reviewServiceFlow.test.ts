/**
 * Phase B — Review Service Integration Tests
 * Tests review creation, status transitions, responses, and cross-tenant isolation.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createReviewService } from "../services/reviewService.js";
import type { BossEvent } from "@boss/events";

const ORG_A = "org-rev-a";
const ORG_B = "org-rev-b";
const BIZ_A = "biz-rev-a";
const BIZ_B = "biz-rev-b";
const CUST = "cust-rev-001";

describe("Phase B — Review Service Flow", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  it("creates a review with correct fields", async () => {
    const svc = createReviewService(c);
    const review = await svc.createReview(ORG_A, BIZ_A, {
      customerId: CUST,
      rating: 4,
      title: "Great service",
      body: "Really impressed with the team.",
    });

    expect(review.id).toBeDefined();
    expect(review.orgId).toBe(ORG_A);
    expect(review.businessId).toBe(BIZ_A);
    expect(review.customerId).toBe(CUST);
    expect(review.rating).toBe(4);
    expect(review.title).toBe("Great service");
    expect(review.status).toBe("pending");
  });

  it("emits review.received event", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("review.received", (e) => seen.push(e as BossEvent));

    const svc = createReviewService(c);
    const review = await svc.createReview(ORG_A, BIZ_A, {
      customerId: CUST,
      rating: 5,
    });

    expect(seen).toHaveLength(1);
    expect((seen[0]!.payload as Record<string, unknown>).reviewId).toBe(review.id);
    expect((seen[0]!.payload as Record<string, unknown>).rating).toBe(5);
  });

  it("rejects reviews with rating outside 1-5", async () => {
    const svc = createReviewService(c);
    await expect(svc.createReview(ORG_A, BIZ_A, { customerId: CUST, rating: 0 })).rejects.toThrow();
    await expect(svc.createReview(ORG_A, BIZ_A, { customerId: CUST, rating: 6 })).rejects.toThrow();
  });

  it("accepts all valid ratings 1-5", async () => {
    const svc = createReviewService(c);
    for (let rating = 1; rating <= 5; rating++) {
      const review = await svc.createReview(ORG_A, BIZ_A, { customerId: CUST, rating });
      expect(review.rating).toBe(rating);
    }
  });

  it("publishes review → status becomes published", async () => {
    const svc = createReviewService(c);
    const review = await svc.createReview(ORG_A, BIZ_A, { customerId: CUST, rating: 5 });

    const published = await svc.updateStatus(ORG_A, review.id, "published");
    expect(published.status).toBe("published");
  });

  it("flags/hides review via updateStatus", async () => {
    const svc = createReviewService(c);
    const review = await svc.createReview(ORG_A, BIZ_A, { customerId: CUST, rating: 1, body: "Spam" });

    const flagged = await svc.updateStatus(ORG_A, review.id, "flagged");
    expect(flagged.status).toBe("flagged");

    const hidden = await svc.updateStatus(ORG_A, review.id, "hidden");
    expect(hidden.status).toBe("hidden");
  });

  it("adds business response — response field and respondedAt populated", async () => {
    const svc = createReviewService(c);
    const review = await svc.createReview(ORG_A, BIZ_A, { customerId: CUST, rating: 3 });

    const responded = await svc.respondToReview(ORG_A, review.id, "Thank you for your feedback!");
    expect(responded.response).toBe("Thank you for your feedback!");
    expect(responded.respondedAt).toBeDefined();
    expect(responded.respondedAt).not.toBeNull();
  });

  it("calculates average rating from published reviews", async () => {
    const svc = createReviewService(c);

    const rev4 = await svc.createReview(ORG_A, BIZ_A, { customerId: CUST, rating: 4 });
    const rev5 = await svc.createReview(ORG_A, BIZ_A, { customerId: "cust-2", rating: 5 });
    // Pending review — should not affect average
    await svc.createReview(ORG_A, BIZ_A, { customerId: "cust-3", rating: 1 });

    await svc.updateStatus(ORG_A, rev4.id, "published");
    await svc.updateStatus(ORG_A, rev5.id, "published");

    const reviews = await svc.listByBusiness(ORG_A, BIZ_A);
    const published = reviews.filter((r) => r.status === "published");
    const avg = published.reduce((s, r) => s + r.rating, 0) / published.length;
    expect(avg).toBe(4.5);
  });

  it("cross-tenant isolation: org-A reviews invisible to org-B", async () => {
    const svc = createReviewService(c);
    await svc.createReview(ORG_A, BIZ_A, { customerId: CUST, rating: 5 });

    const reviewsB = await svc.listByBusiness(ORG_B, BIZ_A);
    expect(reviewsB).toHaveLength(0);
  });

  it("listByBusiness returns only reviews for that business", async () => {
    const svc = createReviewService(c);
    await svc.createReview(ORG_A, BIZ_A, { customerId: CUST, rating: 4 });
    await svc.createReview(ORG_A, BIZ_A, { customerId: CUST, rating: 3 });
    await svc.createReview(ORG_A, BIZ_B, { customerId: CUST, rating: 5 });

    const reviewsA = await svc.listByBusiness(ORG_A, BIZ_A);
    expect(reviewsA).toHaveLength(2);
    expect(reviewsA.every((r) => r.businessId === BIZ_A)).toBe(true);
  });

  it("filters by rating using client-side filter after listByBusiness", async () => {
    const svc = createReviewService(c);
    await svc.createReview(ORG_A, BIZ_A, { customerId: CUST, rating: 5 });
    await svc.createReview(ORG_A, BIZ_A, { customerId: "c2", rating: 3 });
    await svc.createReview(ORG_A, BIZ_A, { customerId: "c3", rating: 5 });

    const all = await svc.listByBusiness(ORG_A, BIZ_A);
    const fiveStars = all.filter((r) => r.rating === 5);
    expect(fiveStars).toHaveLength(2);
  });
});
