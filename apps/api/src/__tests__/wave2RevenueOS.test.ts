/**
 * Wave 2 Revenue OS — Integration Tests
 * Covers:
 *   1. Full revenue lifecycle: Lead → Estimate → Invoice → Payment → Revenue metrics
 *   2. Collections cycle: Invoice overdue → case opened → reminder → escalation → resolution
 *   3. Pricing engine: calculate with tax rule + discount rule
 *   4. Revenue intelligence: compute metrics from invoice data
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createEstimateService } from "../services/estimateService.js";
import { createInvoiceService } from "../services/invoiceService.js";
import { createPaymentService } from "../services/paymentService.js";
import { createPricingEngineService } from "../services/pricingEngineService.js";
import { createCollectionsService } from "../services/collectionsService.js";
import { createRevenueIntelligenceService } from "../services/revenueIntelligenceService.js";
import type { RepositoryContainer } from "../container.js";

function makeRepos(): RepositoryContainer {
  return createInMemoryContainer();
}

const ORG_ID = "org-test-1";
const BIZ_ID = "biz-test-1";
const CUSTOMER_ID = "cust-test-1";

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 1: Full Revenue Lifecycle
// ─────────────────────────────────────────────────────────────────────────────

describe("Scenario 1: Full Revenue Lifecycle", () => {
  let repos: RepositoryContainer;

  beforeEach(() => {
    repos = makeRepos();
  });

  it("creates estimate, converts to invoice, records payment, computes metrics", async () => {
    const estimateService = createEstimateService(repos);
    const invoiceService = createInvoiceService(repos);
    const paymentService = createPaymentService(repos);
    const revenueIntelligence = createRevenueIntelligenceService(repos, repos.eventBus);

    // 1. Create estimate
    const estimate = await estimateService.create(
      ORG_ID,
      BIZ_ID,
      {
        customerId: CUSTOMER_ID,
        estimateNumber: "EST-001",
        lineItems: [{ description: "Service A", quantity: 2, unitPriceCents: 5000, totalCents: 10000 }],
        taxRate: 10, // 10% tax
        discountCents: 0,
      },
      "actor-1",
    );

    expect(estimate.status).toBe("draft");
    expect(estimate.subtotalCents).toBe(10000);
    expect(estimate.taxCents).toBe(1000); // 10% of 10000
    expect(estimate.totalCents).toBe(11000);

    // 2. Send estimate
    const sent = await estimateService.send(ORG_ID, estimate.id, "actor-1");
    expect(sent.status).toBe("sent");

    // 3. Customer views estimate
    const viewed = await estimateService.markViewed(ORG_ID, estimate.id);
    expect(viewed.status).toBe("viewed");

    // 4. Accept estimate
    const accepted = await estimateService.accept(ORG_ID, estimate.id, "actor-1");
    expect(accepted.status).toBe("accepted");

    // 5. Create invoice
    const invoice = await invoiceService.createInvoice(ORG_ID, BIZ_ID, {
      customerId: CUSTOMER_ID,
      lineItems: [{ description: "Service A", quantity: 2, unitPriceCents: 5000 }],
      taxCents: 1000,
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    });
    expect(invoice.status).toBe("draft");
    expect(invoice.totalCents).toBe(11000);

    // 6. Convert estimate to invoice
    const converted = await estimateService.convert(ORG_ID, estimate.id, invoice.id, "actor-1");
    expect(converted.status).toBe("converted");
    expect(converted.convertedInvoiceId).toBe(invoice.id);

    // 7. Send invoice
    const sentInvoice = await invoiceService.sendInvoice(ORG_ID, invoice.id);
    expect(sentInvoice.status).toBe("sent");

    // 8. Customer views invoice
    const viewedInvoice = await invoiceService.markViewed(ORG_ID, invoice.id);
    expect(viewedInvoice.status).toBe("viewed");

    // 9. Record payment
    const payment = await paymentService.createPayment(ORG_ID, BIZ_ID, {
      customerId: CUSTOMER_ID,
      invoiceId: invoice.id,
      amountCents: 11000,
      method: "card",
      paidAt: new Date().toISOString(),
    });
    expect(payment.amountCents).toBe(11000);

    // 10. Mark payment completed
    const completedPayment = await paymentService.updateStatus(ORG_ID, payment.id, "completed");
    expect(completedPayment.status).toBe("completed");

    // 11. Verify invoice is now paid
    const paidInvoice = await invoiceService.getInvoice(ORG_ID, invoice.id);
    expect(paidInvoice.status).toBe("paid");

    // 12. Compute revenue metrics
    const metrics = await revenueIntelligence.compute(ORG_ID, BIZ_ID);
    expect(metrics.paidRevenueCents).toBe(11000);
    expect(metrics.totalRevenueCents).toBe(11000);
    expect(metrics.collectionRate).toBeGreaterThan(0);
  });

  it("supports percentage-based tax and discount in estimates", async () => {
    const estimateService = createEstimateService(repos);
    const estimate = await estimateService.create(
      ORG_ID,
      BIZ_ID,
      {
        customerId: CUSTOMER_ID,
        estimateNumber: "EST-002",
        lineItems: [{ description: "Package", quantity: 1, unitPriceCents: 20000, totalCents: 20000 }],
        taxRate: 8.5,      // 8.5% tax = 1700
        discountRate: 5,   // 5% discount = 1000
      },
      "actor-1",
    );

    expect(estimate.subtotalCents).toBe(20000);
    expect(estimate.discountCents).toBe(1000); // 5% of 20000
    expect(estimate.taxCents).toBe(1700);       // 8.5% of 20000
    expect(estimate.totalCents).toBe(20700);    // 20000 - 1000 + 1700
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 2: Collections Cycle
// ─────────────────────────────────────────────────────────────────────────────

describe("Scenario 2: Collections Cycle", () => {
  let repos: RepositoryContainer;

  beforeEach(() => {
    repos = makeRepos();
  });

  it("invoice overdue → case opened → reminder → escalation → resolution", async () => {
    const invoiceService = createInvoiceService(repos);
    const collectionsService = createCollectionsService(repos, invoiceService, repos.eventBus);

    // Create overdue invoice
    const overdueDueAt = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(); // 20 days ago
    const invoice = await invoiceService.createInvoice(ORG_ID, BIZ_ID, {
      customerId: CUSTOMER_ID,
      lineItems: [{ description: "Unpaid service", quantity: 1, unitPriceCents: 50000 }],
      dueAt: overdueDueAt,
    });

    // Send invoice so it can become overdue
    await invoiceService.sendInvoice(ORG_ID, invoice.id);

    // Mark overdue
    const { updated } = await invoiceService.markOverdue(ORG_ID, BIZ_ID);
    expect(updated).toBe(1);

    const overdueInvoice = await invoiceService.getInvoice(ORG_ID, invoice.id);
    expect(overdueInvoice.status).toBe("overdue");

    // List overdue invoices
    const overdueList = await invoiceService.listOverdue(ORG_ID, BIZ_ID);
    expect(overdueList).toHaveLength(1);
    expect(overdueList[0]?.id).toBe(invoice.id);

    // Open collections case
    const collectionsCase = await collectionsService.openCase(ORG_ID, BIZ_ID, invoice.id);
    expect(collectionsCase.status).toBe("pending");
    expect(collectionsCase.amountCents).toBe(50000);
    expect(collectionsCase.riskScore).toBeGreaterThan(0);

    // Idempotent re-open
    const sameCase = await collectionsService.openCase(ORG_ID, BIZ_ID, invoice.id);
    expect(sameCase.id).toBe(collectionsCase.id);

    // Send reminder
    const reminded = await collectionsService.sendReminder(ORG_ID, collectionsCase.id);
    expect(reminded.status).toBe("in_reminder");
    expect(reminded.actions).toHaveLength(1);
    expect(reminded.actions[0]?.action).toBe("reminder_sent");

    // Escalate
    const escalated = await collectionsService.escalate(ORG_ID, collectionsCase.id, "No response after reminder");
    expect(escalated.status).toBe("escalated");
    expect(escalated.actions).toHaveLength(2);

    // Create payment plan
    const withPlan = await collectionsService.createPaymentPlan(ORG_ID, collectionsCase.id, 25000, 30);
    expect(withPlan.status).toBe("payment_plan");
    expect(withPlan.paymentPlan?.installmentCents).toBe(25000);
    expect(withPlan.paymentPlan?.remainingInstallments).toBe(2);

    // Resolve
    const resolved = await collectionsService.resolve(ORG_ID, collectionsCase.id);
    expect(resolved.status).toBe("resolved");
    expect(resolved.outstandingCents).toBe(0);

    // List cases
    const cases = await collectionsService.listCases(ORG_ID, BIZ_ID);
    expect(cases).toHaveLength(1);
  });

  it("computeRiskScore follows the defined formula", () => {
    const invoiceService = createInvoiceService(repos);
    const collectionsService = createCollectionsService(repos, invoiceService, repos.eventBus);

    // Formula: min(1, (days/90)*0.6 + previousOverdue*0.2 + min(0.2, cents/1_000_000))
    const score1 = collectionsService.computeRiskScore(0, 0);
    expect(score1).toBe(0);

    const score2 = collectionsService.computeRiskScore(90, 500000);
    expect(score2).toBeCloseTo(0.6 + 0.1, 2);

    const score3 = collectionsService.computeRiskScore(90, 1_000_000, { previousOverdueCount: 2 });
    expect(score3).toBe(1); // capped at 1
  });

  it("invoice can be cancelled and refunded", async () => {
    const invoiceService = createInvoiceService(repos);
    const invoice = await invoiceService.createInvoice(ORG_ID, BIZ_ID, {
      customerId: CUSTOMER_ID,
      lineItems: [{ description: "Test", quantity: 1, unitPriceCents: 10000 }],
    });

    await invoiceService.sendInvoice(ORG_ID, invoice.id);
    const cancelled = await invoiceService.cancel(ORG_ID, invoice.id, "Customer requested");
    expect(cancelled.status).toBe("cancelled");

    // Create another invoice and refund after payment
    const invoice2 = await invoiceService.createInvoice(ORG_ID, BIZ_ID, {
      customerId: CUSTOMER_ID,
      lineItems: [{ description: "Test 2", quantity: 1, unitPriceCents: 10000 }],
    });
    await invoiceService.sendInvoice(ORG_ID, invoice2.id);
    await invoiceService.markPaid(ORG_ID, invoice2.id, "card");
    const refunded = await invoiceService.refund(ORG_ID, invoice2.id, 5000, "Partial refund");
    expect(refunded.status).toBe("refunded");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 3: Pricing Engine
// ─────────────────────────────────────────────────────────────────────────────

describe("Scenario 3: Pricing Engine", () => {
  let repos: RepositoryContainer;

  beforeEach(() => {
    repos = makeRepos();
  });

  it("calculates price with tax rule and discount rule", async () => {
    const pricingEngine = createPricingEngineService(repos.eventBus);

    // Add a tax rule
    await pricingEngine.addTaxRule(ORG_ID, BIZ_ID, {
      key: "state_tax",
      label: "State Tax",
      rate: 8,
      inclusive: false,
      active: true,
    });

    // Add a discount rule (percentage, auto-apply)
    await pricingEngine.addDiscountRule(ORG_ID, BIZ_ID, {
      label: "Loyalty Discount",
      type: "percentage",
      value: 10, // 10%
      active: true,
    });

    // Add a coupon
    await pricingEngine.addDiscountRule(ORG_ID, BIZ_ID, {
      code: "SAVE20",
      label: "20% Off Coupon",
      type: "percentage",
      value: 20,
      active: true,
      maxUses: 100,
      expiresAt: null,
    });

    // Calculate
    const result = await pricingEngine.calculate({
      orgId: ORG_ID,
      businessId: BIZ_ID,
      items: [
        { key: "service_a", quantity: 2, basePriceCents: 5000 },
      ],
      couponCode: "SAVE20",
    });

    // subtotal: 2 * 5000 = 10000
    expect(result.subtotalCents).toBe(10000);
    // loyalty discount: 10% of 10000 = 1000
    // coupon discount: 20% of 10000 = 2000
    expect(result.discountCents).toBe(3000);
    expect(result.discountDetails).toHaveLength(2);
    // after discount: 7000
    // tax: 8% of 7000 = 560
    expect(result.taxCents).toBe(560);
    expect(result.totalCents).toBe(7560);
    expect(result.appliedCoupon).toBe("SAVE20");
  });

  it("validates coupon codes", async () => {
    const pricingEngine = createPricingEngineService(repos.eventBus);

    await pricingEngine.addDiscountRule(ORG_ID, BIZ_ID, {
      code: "VALID",
      label: "Valid Coupon",
      type: "flat",
      value: 500,
      active: true,
      maxUses: 10,
    });

    const valid = await pricingEngine.validateCoupon(ORG_ID, BIZ_ID, "VALID");
    expect(valid).not.toBeNull();
    expect(valid?.code).toBe("VALID");

    const invalid = await pricingEngine.validateCoupon(ORG_ID, BIZ_ID, "NOTEXIST");
    expect(invalid).toBeNull();
  });

  it("applies tiered pricing rules", async () => {
    const pricingEngine = createPricingEngineService(repos.eventBus);

    await pricingEngine.addPriceRule(ORG_ID, BIZ_ID, {
      key: "volume_pricing",
      label: "Volume Pricing",
      type: "tiered",
      tiers: [
        { upTo: 5, pricePerUnitCents: 1000 },
        { upTo: 10, pricePerUnitCents: 900 },
        { upTo: null, pricePerUnitCents: 800 },
      ],
      priority: 1,
      active: true,
    });

    const result = await pricingEngine.calculate({
      orgId: ORG_ID,
      businessId: BIZ_ID,
      items: [{ key: "widget", quantity: 8, basePriceCents: 1000 }],
    });

    // 8 units fall in the 6-10 tier: 900 per unit
    expect(result.items[0]?.unitPriceCents).toBe(900);
    expect(result.items[0]?.totalCents).toBe(7200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 4: Revenue Intelligence
// ─────────────────────────────────────────────────────────────────────────────

describe("Scenario 4: Revenue Intelligence", () => {
  let repos: RepositoryContainer;

  beforeEach(() => {
    repos = makeRepos();
  });

  it("computes revenue metrics from invoice data", async () => {
    const invoiceService = createInvoiceService(repos);
    const revenueIntelligence = createRevenueIntelligenceService(repos, repos.eventBus);

    // Create 3 invoices: 2 paid, 1 overdue
    const inv1 = await invoiceService.createInvoice(ORG_ID, BIZ_ID, {
      customerId: CUSTOMER_ID,
      lineItems: [{ description: "Job 1", quantity: 1, unitPriceCents: 30000 }],
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    await invoiceService.sendInvoice(ORG_ID, inv1.id);
    await invoiceService.markPaid(ORG_ID, inv1.id);

    const inv2 = await invoiceService.createInvoice(ORG_ID, BIZ_ID, {
      customerId: "cust-2",
      lineItems: [{ description: "Job 2", quantity: 1, unitPriceCents: 50000 }],
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    await invoiceService.sendInvoice(ORG_ID, inv2.id);
    await invoiceService.markPaid(ORG_ID, inv2.id);

    const inv3 = await invoiceService.createInvoice(ORG_ID, BIZ_ID, {
      customerId: CUSTOMER_ID,
      lineItems: [{ description: "Job 3", quantity: 1, unitPriceCents: 20000 }],
      dueAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // past due
    });
    await invoiceService.sendInvoice(ORG_ID, inv3.id);
    await invoiceService.markOverdue(ORG_ID, BIZ_ID);

    // Compute metrics
    const metrics = await revenueIntelligence.compute(ORG_ID, BIZ_ID);

    expect(metrics.paidRevenueCents).toBe(80000); // 30000 + 50000
    expect(metrics.overdueRevenueCents).toBe(20000);
    expect(metrics.totalRevenueCents).toBe(100000);
    expect(metrics.collectionRate).toBeCloseTo(0.8, 2);
    expect(metrics.revenueByCustomer).toHaveLength(2);
    expect(metrics.monthlyRevenue).toHaveLength(6);
    expect(metrics.cashFlowForecast).toHaveLength(3);
  });

  it("computes revenue leakage", async () => {
    const invoiceService = createInvoiceService(repos);
    const revenueIntelligence = createRevenueIntelligenceService(repos, repos.eventBus);

    const inv = await invoiceService.createInvoice(ORG_ID, BIZ_ID, {
      customerId: CUSTOMER_ID,
      lineItems: [{ description: "Overdue", quantity: 1, unitPriceCents: 15000 }],
      dueAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    });
    await invoiceService.sendInvoice(ORG_ID, inv.id);
    await invoiceService.markOverdue(ORG_ID, BIZ_ID);

    const leakage = await revenueIntelligence.revenueLeakage(ORG_ID, BIZ_ID);
    expect(leakage.totalLeakageCents).toBe(15000);
    expect(leakage.overdueCount).toBe(1);
  });

  it("supports partial payment and auto-marks invoice paid", async () => {
    const invoiceService = createInvoiceService(repos);
    const paymentService = createPaymentService(repos);

    const invoice = await invoiceService.createInvoice(ORG_ID, BIZ_ID, {
      customerId: CUSTOMER_ID,
      lineItems: [{ description: "Big project", quantity: 1, unitPriceCents: 10000 }],
    });
    await invoiceService.sendInvoice(ORG_ID, invoice.id);

    // First partial payment
    await paymentService.recordPartialPayment(ORG_ID, BIZ_ID, {
      invoiceId: invoice.id,
      amountCents: 5000,
      method: "bank_transfer",
    });

    const afterFirst = await invoiceService.getInvoice(ORG_ID, invoice.id);
    expect(afterFirst.status).toBe("sent"); // not yet fully paid

    // Second partial payment covers the rest
    await paymentService.recordPartialPayment(ORG_ID, BIZ_ID, {
      invoiceId: invoice.id,
      amountCents: 5000,
      method: "bank_transfer",
    });

    const afterSecond = await invoiceService.getInvoice(ORG_ID, invoice.id);
    expect(afterSecond.status).toBe("paid");
  });
});
