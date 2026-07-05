/**
 * Phase B — Payment Service Integration Tests
 * Tests payment creation, status transitions, invoice linkage, and cross-tenant isolation.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createPaymentService } from "../services/paymentService.js";
import { createInvoiceService } from "../services/invoiceService.js";
import type { BossEvent } from "@boss/events";

const ORG_A = "org-pay-a";
const ORG_B = "org-pay-b";
const BIZ_A = "biz-pay-a";
const BIZ_B = "biz-pay-b";
const CUST = "cust-pay-001";

async function createTestInvoice(c: ReturnType<typeof createInMemoryContainer>, orgId = ORG_A, bizId = BIZ_A) {
  const invSvc = createInvoiceService(c);
  return invSvc.createInvoice(orgId, bizId, {
    customerId: CUST,
    lineItems: [{ description: "Service", quantity: 1, unitPriceCents: 15000 }],
  });
}

describe("Phase B — Payment Service Flow", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  it("creates a payment against an invoice", async () => {
    const invoice = await createTestInvoice(c);
    const svc = createPaymentService(c);

    const payment = await svc.createPayment(ORG_A, BIZ_A, {
      customerId: CUST,
      invoiceId: invoice.id,
      amountCents: 15000,
      method: "card",
    });

    expect(payment.id).toBeDefined();
    expect(payment.orgId).toBe(ORG_A);
    expect(payment.businessId).toBe(BIZ_A);
    expect(payment.invoiceId).toBe(invoice.id);
    expect(payment.amountCents).toBe(15000);
    expect(payment.method).toBe("card");
    expect(payment.status).toBe("pending");
  });

  it("emits payment.created event", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("payment.created", (e) => seen.push(e as BossEvent));

    const invoice = await createTestInvoice(c);
    const svc = createPaymentService(c);
    const payment = await svc.createPayment(ORG_A, BIZ_A, {
      customerId: CUST,
      invoiceId: invoice.id,
      amountCents: 15000,
      method: "bank_transfer",
    });

    expect(seen).toHaveLength(1);
    expect((seen[0]!.payload as Record<string, unknown>).paymentId).toBe(payment.id);
  });

  it("marks payment complete → status becomes completed, paidAt set", async () => {
    const invoice = await createTestInvoice(c);
    const svc = createPaymentService(c);
    const payment = await svc.createPayment(ORG_A, BIZ_A, {
      customerId: CUST,
      invoiceId: invoice.id,
      amountCents: 15000,
      method: "card",
    });

    const completed = await svc.updateStatus(ORG_A, payment.id, "completed");
    expect(completed.status).toBe("completed");
    expect(completed.paidAt).toBeDefined();
  });

  it("completing payment updates linked invoice to paid", async () => {
    const invoice = await createTestInvoice(c);
    const svc = createPaymentService(c);
    const payment = await svc.createPayment(ORG_A, BIZ_A, {
      customerId: CUST,
      invoiceId: invoice.id,
      amountCents: 15000,
      method: "card",
    });

    await svc.updateStatus(ORG_A, payment.id, "completed");

    const invSvc = createInvoiceService(c);
    const updatedInvoice = await invSvc.getInvoice(ORG_A, invoice.id);
    expect(updatedInvoice.status).toBe("paid");
    expect(updatedInvoice.paidAt).toBeDefined();
  });

  it("emits payment.received event", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("payment.received", (e) => seen.push(e as BossEvent));

    const invoice = await createTestInvoice(c);
    const svc = createPaymentService(c);
    const payment = await svc.createPayment(ORG_A, BIZ_A, {
      customerId: CUST,
      invoiceId: invoice.id,
      amountCents: 15000,
      method: "cash",
    });
    await svc.updateStatus(ORG_A, payment.id, "completed");

    expect(seen).toHaveLength(1);
    expect((seen[0]!.payload as Record<string, unknown>).paymentId).toBe(payment.id);
    expect((seen[0]!.payload as Record<string, unknown>).invoiceId).toBe(invoice.id);
  });

  it("marks payment as refunded", async () => {
    const invoice = await createTestInvoice(c);
    const svc = createPaymentService(c);
    const payment = await svc.createPayment(ORG_A, BIZ_A, {
      customerId: CUST,
      invoiceId: invoice.id,
      amountCents: 15000,
      method: "card",
    });
    await svc.updateStatus(ORG_A, payment.id, "completed");

    const refunded = await svc.updateStatus(ORG_A, payment.id, "refunded");
    expect(refunded.status).toBe("refunded");
  });

  it("cross-tenant isolation: org-A payments invisible to org-B", async () => {
    const invoice = await createTestInvoice(c);
    const svc = createPaymentService(c);
    await svc.createPayment(ORG_A, BIZ_A, {
      customerId: CUST,
      invoiceId: invoice.id,
      amountCents: 5000,
      method: "card",
    });

    const paymentsB = await svc.listByBusiness(ORG_B, BIZ_A);
    expect(paymentsB).toHaveLength(0);
  });

  it("listByBusiness returns only payments for that business", async () => {
    const invoice1 = await createTestInvoice(c, ORG_A, BIZ_A);
    const invSvc = createInvoiceService(c);
    const invoice2 = await invSvc.createInvoice(ORG_A, BIZ_B, {
      customerId: CUST,
      lineItems: [{ description: "Service B", quantity: 1, unitPriceCents: 8000 }],
    });

    const svc = createPaymentService(c);
    await svc.createPayment(ORG_A, BIZ_A, {
      customerId: CUST,
      invoiceId: invoice1.id,
      amountCents: 15000,
      method: "card",
    });
    await svc.createPayment(ORG_A, BIZ_B, {
      customerId: CUST,
      invoiceId: invoice2.id,
      amountCents: 8000,
      method: "bank_transfer",
    });

    const paymentsA = await svc.listByBusiness(ORG_A, BIZ_A);
    expect(paymentsA).toHaveLength(1);
    expect(paymentsA[0]!.businessId).toBe(BIZ_A);
  });

  it("getPayment throws when payment does not exist", async () => {
    const svc = createPaymentService(c);
    await expect(svc.getPayment(ORG_A, "nonexistent-id")).rejects.toThrow();
  });
});
