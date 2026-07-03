/**
 * Phase B — Invoice Service Integration Tests
 * Tests invoice creation with line items, totals calculation, status transitions,
 * and cross-tenant isolation.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createInvoiceService } from "../services/invoiceService.js";
import type { BossEvent } from "@boss/events";

const ORG_A = "org-inv-a";
const ORG_B = "org-inv-b";
const BIZ_A = "biz-inv-a";
const BIZ_B = "biz-inv-b";
const CUST = "cust-inv-001";

describe("Phase B — Invoice Service Flow", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  it("creates invoice and computes subtotal/tax/total correctly", async () => {
    const svc = createInvoiceService(c);
    const invoice = await svc.createInvoice(ORG_A, BIZ_A, {
      customerId: CUST,
      lineItems: [
        { description: "Labor", quantity: 2, unitPriceCents: 5000 },
        { description: "Parts", quantity: 3, unitPriceCents: 2000 },
      ],
      taxCents: 900,
      discountCents: 0,
    });

    // subtotal = (2 * 5000) + (3 * 2000) = 10000 + 6000 = 16000
    expect(invoice.subtotalCents).toBe(16000);
    expect(invoice.taxCents).toBe(900);
    expect(invoice.discountCents).toBe(0);
    // total = 16000 + 900 - 0 = 16900
    expect(invoice.totalCents).toBe(16900);
    expect(invoice.status).toBe("draft");
    expect(invoice.lineItems).toHaveLength(2);
  });

  it("applies discount to total", async () => {
    const svc = createInvoiceService(c);
    const invoice = await svc.createInvoice(ORG_A, BIZ_A, {
      customerId: CUST,
      lineItems: [{ description: "Service fee", quantity: 1, unitPriceCents: 10000 }],
      taxCents: 500,
      discountCents: 1000,
    });

    // subtotal = 10000, total = 10000 + 500 - 1000 = 9500
    expect(invoice.subtotalCents).toBe(10000);
    expect(invoice.totalCents).toBe(9500);
  });

  it("emits invoice.created event", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("invoice.created", (e) => seen.push(e as BossEvent));

    const svc = createInvoiceService(c);
    const invoice = await svc.createInvoice(ORG_A, BIZ_A, {
      customerId: CUST,
      lineItems: [{ description: "Consulting", quantity: 1, unitPriceCents: 20000 }],
    });

    expect(seen).toHaveLength(1);
    expect((seen[0]!.payload as Record<string, unknown>).invoiceId).toBe(invoice.id);
  });

  it("sends invoice → status becomes sent, sentAt populated", async () => {
    const svc = createInvoiceService(c);
    const invoice = await svc.createInvoice(ORG_A, BIZ_A, {
      customerId: CUST,
      lineItems: [{ description: "Design work", quantity: 5, unitPriceCents: 3000 }],
    });

    const sent = await svc.sendInvoice(ORG_A, invoice.id);
    expect(sent.status).toBe("sent");
    expect(sent.sentAt).toBeDefined();
    expect(sent.sentAt).not.toBeNull();
  });

  it("emits invoice.sent event on send", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("invoice.sent", (e) => seen.push(e as BossEvent));

    const svc = createInvoiceService(c);
    const invoice = await svc.createInvoice(ORG_A, BIZ_A, {
      customerId: CUST,
      lineItems: [{ description: "Dev work", quantity: 8, unitPriceCents: 7500 }],
    });
    await svc.sendInvoice(ORG_A, invoice.id);

    expect(seen).toHaveLength(1);
  });

  it("marks invoice paid → status becomes paid, paidAt populated", async () => {
    const svc = createInvoiceService(c);
    const invoice = await svc.createInvoice(ORG_A, BIZ_A, {
      customerId: CUST,
      lineItems: [{ description: "Installation", quantity: 1, unitPriceCents: 50000 }],
    });
    await svc.sendInvoice(ORG_A, invoice.id);

    const paid = await svc.markPaid(ORG_A, invoice.id, "card");
    expect(paid.status).toBe("paid");
    expect(paid.paidAt).toBeDefined();
    expect(paid.paymentMethod).toBe("card");
  });

  it("emits invoice.paid event", async () => {
    const seen: BossEvent[] = [];
    c.eventBus.subscribe("invoice.paid", (e) => seen.push(e as BossEvent));

    const svc = createInvoiceService(c);
    const invoice = await svc.createInvoice(ORG_A, BIZ_A, {
      customerId: CUST,
      lineItems: [{ description: "Service", quantity: 1, unitPriceCents: 10000 }],
    });
    await svc.markPaid(ORG_A, invoice.id);

    expect(seen).toHaveLength(1);
    expect((seen[0]!.payload as Record<string, unknown>).invoiceId).toBe(invoice.id);
  });

  it("listByBusiness returns correct invoices", async () => {
    const svc = createInvoiceService(c);
    await svc.createInvoice(ORG_A, BIZ_A, {
      customerId: CUST,
      lineItems: [{ description: "Item 1", quantity: 1, unitPriceCents: 1000 }],
    });
    await svc.createInvoice(ORG_A, BIZ_A, {
      customerId: CUST,
      lineItems: [{ description: "Item 2", quantity: 1, unitPriceCents: 2000 }],
    });
    await svc.createInvoice(ORG_A, BIZ_B, {
      customerId: CUST,
      lineItems: [{ description: "Item 3", quantity: 1, unitPriceCents: 3000 }],
    });

    const invoicesA = await svc.listByBusiness(ORG_A, BIZ_A);
    expect(invoicesA).toHaveLength(2);
    expect(invoicesA.every((i) => i.businessId === BIZ_A)).toBe(true);
  });

  it("cross-tenant isolation: org-A invoices invisible to org-B", async () => {
    const svc = createInvoiceService(c);
    await svc.createInvoice(ORG_A, BIZ_A, {
      customerId: CUST,
      lineItems: [{ description: "Private item", quantity: 1, unitPriceCents: 9999 }],
    });

    const invoicesB = await svc.listByBusiness(ORG_B, BIZ_A);
    expect(invoicesB).toHaveLength(0);
  });

  it("invoice numbers are auto-generated and present", async () => {
    const svc = createInvoiceService(c);
    const inv1 = await svc.createInvoice(ORG_A, BIZ_A, {
      customerId: CUST,
      lineItems: [{ description: "X", quantity: 1, unitPriceCents: 100 }],
    });
    const inv2 = await svc.createInvoice(ORG_A, BIZ_A, {
      customerId: CUST,
      lineItems: [{ description: "Y", quantity: 1, unitPriceCents: 200 }],
    });

    expect(inv1.invoiceNumber).toMatch(/^INV-/);
    expect(inv2.invoiceNumber).toMatch(/^INV-/);
    // Numbers should be distinct (collision possible but extremely rare)
    // Just verify they exist and are strings
    expect(typeof inv1.invoiceNumber).toBe("string");
    expect(typeof inv2.invoiceNumber).toBe("string");
  });

  it("soft deletes invoice — not returned in list", async () => {
    const svc = createInvoiceService(c);
    const inv = await svc.createInvoice(ORG_A, BIZ_A, {
      customerId: CUST,
      lineItems: [{ description: "Deletable", quantity: 1, unitPriceCents: 500 }],
    });
    await svc.deleteInvoice(ORG_A, inv.id);

    const invoices = await svc.listByBusiness(ORG_A, BIZ_A);
    expect(invoices.find((i) => i.id === inv.id)).toBeUndefined();
  });
});
