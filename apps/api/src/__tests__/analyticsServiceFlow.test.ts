/**
 * Phase B — Analytics Service Integration Tests
 * Seeds cross-domain data and asserts derived analytics metrics.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createAnalyticsService } from "../services/analyticsService.js";
import { createInvoiceService } from "../services/invoiceService.js";
import { createJobService } from "../services/jobService.js";
import { createAppointmentService } from "../services/appointmentService.js";
import { createReviewService } from "../services/reviewService.js";
import { createPaymentService } from "../services/paymentService.js";

const ORG = "org-analytics-001";
const BIZ = "biz-analytics-001";
const CUST = "cust-analytics-001";

describe("Phase B — Analytics Service Flow", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  it("aggregates revenue from invoices: total, paid, pending", async () => {
    const invSvc = createInvoiceService(c);
    const analyticsSvc = createAnalyticsService(c);

    // 1 paid invoice: 10000 cents
    const paidInv = await invSvc.createInvoice(ORG, BIZ, {
      customerId: CUST,
      lineItems: [{ description: "Service A", quantity: 1, unitPriceCents: 10000 }],
    });
    await invSvc.markPaid(ORG, paidInv.id);

    // 1 sent invoice: 5000 cents (pending)
    const sentInv = await invSvc.createInvoice(ORG, BIZ, {
      customerId: CUST,
      lineItems: [{ description: "Service B", quantity: 1, unitPriceCents: 5000 }],
    });
    await invSvc.sendInvoice(ORG, sentInv.id);

    // 1 draft invoice: 3000 cents (not counted in total/pending)
    await invSvc.createInvoice(ORG, BIZ, {
      customerId: CUST,
      lineItems: [{ description: "Service C", quantity: 1, unitPriceCents: 3000 }],
    });

    const analytics = await analyticsSvc.getBusinessAnalytics(ORG, BIZ);

    expect(analytics.revenue.paidCents).toBe(10000);
    expect(analytics.revenue.pendingCents).toBe(5000);
    // totalCents = paidCents + pendingCents (draft is excluded by service)
    expect(analytics.revenue.totalCents).toBe(15000);
  });

  it("computes job completion rate: 1 of 2 completed = 50%", async () => {
    const jobSvc = createJobService(c);
    const analyticsSvc = createAnalyticsService(c);

    const job1 = await jobSvc.createJob(ORG, BIZ, { title: "Job 1" });
    await jobSvc.completeJob(ORG, job1.id, 60);

    await jobSvc.createJob(ORG, BIZ, { title: "Job 2" }); // in_progress or scheduled

    const analytics = await analyticsSvc.getBusinessAnalytics(ORG, BIZ);

    expect(analytics.jobs.total).toBe(2);
    expect(analytics.jobs.completed).toBe(1);
    expect(analytics.jobs.completionRate).toBe(0.5);
  });

  it("computes average rating from published reviews only", async () => {
    const revSvc = createReviewService(c);
    const analyticsSvc = createAnalyticsService(c);

    const r4 = await revSvc.createReview(ORG, BIZ, { customerId: CUST, rating: 4 });
    const r5 = await revSvc.createReview(ORG, BIZ, { customerId: "c2", rating: 5 });
    // Pending review — excluded from average
    await revSvc.createReview(ORG, BIZ, { customerId: "c3", rating: 1 });

    await revSvc.updateStatus(ORG, r4.id, "published");
    await revSvc.updateStatus(ORG, r5.id, "published");

    const analytics = await analyticsSvc.getBusinessAnalytics(ORG, BIZ);

    expect(analytics.reviews.averageRating).toBe(4.5);
    expect(analytics.reviews.total).toBe(2); // only published
  });

  it("sums completed payment amounts in totalReceivedCents", async () => {
    const invSvc = createInvoiceService(c);
    const paySvc = createPaymentService(c);
    const analyticsSvc = createAnalyticsService(c);

    const inv1 = await invSvc.createInvoice(ORG, BIZ, {
      customerId: CUST,
      lineItems: [{ description: "S", quantity: 1, unitPriceCents: 8000 }],
    });
    const inv2 = await invSvc.createInvoice(ORG, BIZ, {
      customerId: CUST,
      lineItems: [{ description: "T", quantity: 1, unitPriceCents: 4000 }],
    });

    const pay1 = await paySvc.createPayment(ORG, BIZ, {
      customerId: CUST,
      invoiceId: inv1.id,
      amountCents: 8000,
      method: "card",
    });
    await paySvc.updateStatus(ORG, pay1.id, "completed");

    const pay2 = await paySvc.createPayment(ORG, BIZ, {
      customerId: CUST,
      invoiceId: inv2.id,
      amountCents: 4000,
      method: "cash",
    });
    // Leave pay2 pending — should not count

    const analytics = await analyticsSvc.getBusinessAnalytics(ORG, BIZ);
    expect(analytics.payments.totalReceivedCents).toBe(8000);
  });

  it("full seed scenario: 3 invoices, 2 jobs, 2 appointments, 2 reviews, 1 payment", async () => {
    const invSvc = createInvoiceService(c);
    const jobSvc = createJobService(c);
    const apptSvc = createAppointmentService(c);
    const revSvc = createReviewService(c);
    const paySvc = createPaymentService(c);
    const analyticsSvc = createAnalyticsService(c);

    // 3 invoices: 1 paid (12000), 1 sent (6000), 1 draft (2000)
    const paidInv = await invSvc.createInvoice(ORG, BIZ, {
      customerId: CUST,
      lineItems: [{ description: "A", quantity: 1, unitPriceCents: 12000 }],
    });
    await invSvc.markPaid(ORG, paidInv.id);

    const sentInv = await invSvc.createInvoice(ORG, BIZ, {
      customerId: CUST,
      lineItems: [{ description: "B", quantity: 1, unitPriceCents: 6000 }],
    });
    await invSvc.sendInvoice(ORG, sentInv.id);

    await invSvc.createInvoice(ORG, BIZ, {
      customerId: CUST,
      lineItems: [{ description: "C", quantity: 1, unitPriceCents: 2000 }],
    });

    // 2 jobs: 1 completed, 1 in_progress
    const job1 = await jobSvc.createJob(ORG, BIZ, { title: "Completed job" });
    await jobSvc.completeJob(ORG, job1.id, 45);

    const job2 = await jobSvc.createJob(ORG, BIZ, { title: "Active job" });
    await jobSvc.startJob(ORG, job2.id);

    // 2 appointments: 1 completed, 1 scheduled
    const appt1 = await apptSvc.createAppointment(ORG, BIZ, {
      title: "Past appt",
      startAt: "2026-06-01T10:00:00Z",
      endAt: "2026-06-01T11:00:00Z",
    });
    await apptSvc.updateAppointment(ORG, appt1.id, { status: "completed" });

    await apptSvc.createAppointment(ORG, BIZ, {
      title: "Future appt",
      startAt: "2026-08-01T10:00:00Z",
      endAt: "2026-08-01T11:00:00Z",
    });

    // 2 reviews: 4★ and 5★, both published
    const rev4 = await revSvc.createReview(ORG, BIZ, { customerId: CUST, rating: 4 });
    const rev5 = await revSvc.createReview(ORG, BIZ, { customerId: "c2", rating: 5 });
    await revSvc.updateStatus(ORG, rev4.id, "published");
    await revSvc.updateStatus(ORG, rev5.id, "published");

    // 1 payment (completed) for 12000
    const pay = await paySvc.createPayment(ORG, BIZ, {
      customerId: CUST,
      invoiceId: paidInv.id,
      amountCents: 12000,
      method: "card",
    });
    await paySvc.updateStatus(ORG, pay.id, "completed");

    const a = await analyticsSvc.getBusinessAnalytics(ORG, BIZ);

    // Revenue
    expect(a.revenue.paidCents).toBe(12000);
    expect(a.revenue.pendingCents).toBe(6000);
    expect(a.revenue.totalCents).toBe(18000);

    // Jobs
    expect(a.jobs.total).toBe(2);
    expect(a.jobs.completed).toBe(1);
    expect(a.jobs.inProgress).toBe(1);
    expect(a.jobs.completionRate).toBe(0.5);

    // Reviews
    expect(a.reviews.averageRating).toBe(4.5);
    expect(a.reviews.total).toBe(2);

    // Payments
    expect(a.payments.totalReceivedCents).toBe(12000);

    // Appointments
    expect(a.appointments.total).toBe(2);
  });

  it("returns zero values when there is no data", async () => {
    const analyticsSvc = createAnalyticsService(c);
    const a = await analyticsSvc.getBusinessAnalytics(ORG, BIZ);

    expect(a.revenue.totalCents).toBe(0);
    expect(a.revenue.paidCents).toBe(0);
    expect(a.jobs.total).toBe(0);
    expect(a.jobs.completionRate).toBe(0);
    expect(a.reviews.averageRating).toBe(0);
    expect(a.payments.totalReceivedCents).toBe(0);
  });
});
