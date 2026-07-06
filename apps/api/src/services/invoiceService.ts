import type { Invoice, InvoiceLineItem } from "@boss/types";
import type { InvoicePatch } from "@boss/db";
import { randomUUID } from "node:crypto";
import { createBossEvent } from "@boss/events";
import type { RepositoryContainer } from "../container.js";
import { ApiError } from "../http/apiError.js";

export interface InvoiceService {
  createInvoice(orgId: string, businessId: string, input: {
    customerId: string;
    jobId?: string | null;
    lineItems: Array<{ description: string; quantity: number; unitPriceCents: number }>;
    taxCents?: number;
    discountCents?: number;
    currency?: string;
    dueAt?: string | null;
    notes?: string | null;
    terms?: string | null;
  }): Promise<Invoice>;

  getInvoice(orgId: string, invoiceId: string): Promise<Invoice>;

  updateInvoice(orgId: string, invoiceId: string, patch: InvoicePatch): Promise<Invoice>;

  sendInvoice(orgId: string, invoiceId: string): Promise<Invoice>;
  markPaid(orgId: string, invoiceId: string, paymentMethod?: string): Promise<Invoice>;

  listByBusiness(orgId: string, businessId: string): Promise<Invoice[]>;
  listByCustomer(orgId: string, customerId: string): Promise<Invoice[]>;

  deleteInvoice(orgId: string, invoiceId: string): Promise<void>;

  /** Transition sent→viewed when customer opens invoice link */
  markViewed(orgId: string, invoiceId: string): Promise<Invoice>;
  /** Scan all sent invoices past dueAt and transition to overdue */
  markOverdue(orgId: string, businessId: string): Promise<{ updated: number }>;
  /** Cancel an invoice */
  cancel(orgId: string, invoiceId: string, reason?: string): Promise<Invoice>;
  /** Refund a paid invoice */
  refund(orgId: string, invoiceId: string, amountCents: number, reason?: string): Promise<Invoice>;
  /** List all overdue invoices for a business */
  listOverdue(orgId: string, businessId: string): Promise<Invoice[]>;
  /** Apply a credit note to reduce invoice balance */
  applyCreditNote(orgId: string, invoiceId: string, amountCents: number): Promise<Invoice>;
}

function generateInvoiceNumber(): string {
  const date = new Date();
  const yymm = `${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${yymm}-${rand}`;
}

function computeTotals(
  lineItems: InvoiceLineItem[],
  taxCents: number,
  discountCents: number
) {
  const subtotalCents = lineItems.reduce((s, li) => s + li.totalCents, 0);
  const totalCents = Math.max(0, subtotalCents + taxCents - discountCents);
  return { subtotalCents, totalCents };
}

export function createInvoiceService(repos: RepositoryContainer): InvoiceService {
  return {
    async createInvoice(orgId, businessId, input) {
      const lineItems: InvoiceLineItem[] = input.lineItems.map((li) => ({
        id: randomUUID(),
        description: li.description,
        quantity: li.quantity,
        unitPriceCents: li.unitPriceCents,
        totalCents: li.quantity * li.unitPriceCents,
      }));

      const taxCents = input.taxCents ?? 0;
      const discountCents = input.discountCents ?? 0;
      const { subtotalCents, totalCents } = computeTotals(lineItems, taxCents, discountCents);

      const invoice = await repos.invoices.create({
        orgId,
        businessId,
        customerId: input.customerId,
        jobId: input.jobId ?? null,
        invoiceNumber: generateInvoiceNumber(),
        status: 'draft',
        lineItems,
        subtotalCents,
        taxCents,
        discountCents,
        totalCents,
        currency: input.currency ?? 'USD',
        dueAt: input.dueAt ?? null,
        sentAt: null,
        paidAt: null,
        paymentMethod: null,
        notes: input.notes ?? null,
        terms: input.terms ?? null,
        metadata: {},
      });

      await repos.eventBus.publish({
        type: "invoice.created",
        payload: { orgId, businessId, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber },
        occurredAt: new Date().toISOString(),
      });

      return invoice;
    },

    async getInvoice(orgId, invoiceId) {
      const inv = await repos.invoices.findById(orgId, invoiceId);
      if (!inv) throw new Error(`Invoice ${invoiceId} not found`);
      return inv;
    },

    async updateInvoice(orgId, invoiceId, patch) {
      const merged: InvoicePatch = { ...patch };
      if (patch.lineItems) {
        const existing = await repos.invoices.findById(orgId, invoiceId);
        if (existing) {
          const tax = patch.taxCents ?? existing.taxCents;
          const discount = patch.discountCents ?? existing.discountCents;
          const totals = computeTotals(patch.lineItems, tax, discount);
          merged.subtotalCents = totals.subtotalCents;
          merged.totalCents = totals.totalCents;
        }
      }

      return repos.invoices.update(orgId, invoiceId, merged);
    },

    async sendInvoice(orgId, invoiceId) {
      const now = new Date().toISOString();
      const inv = await repos.invoices.update(orgId, invoiceId, {
        status: 'sent',
        sentAt: now,
      });

      await repos.eventBus.publish({
        type: "invoice.sent",
        payload: { orgId, invoiceId, sentAt: now },
        occurredAt: now,
      });

      return inv;
    },

    async markPaid(orgId, invoiceId, paymentMethod) {
      const now = new Date().toISOString();
      const inv = await repos.invoices.update(orgId, invoiceId, {
        status: 'paid',
        paidAt: now,
        paymentMethod: paymentMethod ?? null,
      });

      await repos.eventBus.publish({
        type: "invoice.paid",
        payload: { orgId, invoiceId, paidAt: now },
        occurredAt: now,
      });

      return inv;
    },

    async listByBusiness(orgId, businessId) {
      return repos.invoices.listByBusiness(orgId, businessId);
    },

    async listByCustomer(orgId, customerId) {
      return repos.invoices.listByCustomer(orgId, customerId);
    },

    async deleteInvoice(orgId, invoiceId) {
      await repos.invoices.softDelete(orgId, invoiceId);
    },

    async markViewed(orgId, invoiceId) {
      const inv = await repos.invoices.findById(orgId, invoiceId);
      if (!inv) throw new ApiError(404, "INVOICE_NOT_FOUND", `Invoice ${invoiceId} not found`);
      if (inv.status !== "sent") {
        throw new ApiError(409, "INVOICE_INVALID_STATUS", "Only sent invoices can be marked as viewed");
      }
      const updated = await repos.invoices.update(orgId, invoiceId, { status: "viewed" });
      await repos.eventBus.publish(
        createBossEvent("invoice.viewed", { invoiceId, customerId: inv.customerId }, {
          orgId, businessId: inv.businessId, actorId: "customer",
          requestId: invoiceId, correlationId: invoiceId, traceId: invoiceId,
        }),
      );
      return updated;
    },

    async markOverdue(orgId, businessId) {
      const invoices = await repos.invoices.listByBusiness(orgId, businessId);
      const now = new Date().toISOString();
      let updated = 0;
      for (const inv of invoices) {
        if (["sent", "viewed"].includes(inv.status) && inv.dueAt !== null && inv.dueAt < now) {
          await repos.invoices.update(orgId, inv.id, { status: "overdue" });
          await repos.eventBus.publish(
            createBossEvent("invoice.overdue", { invoiceId: inv.id, businessId, dueAt: inv.dueAt, amountCents: inv.totalCents }, {
              orgId, businessId, actorId: "system",
              requestId: inv.id, correlationId: inv.id, traceId: inv.id,
            }),
          );
          updated++;
        }
      }
      return { updated };
    },

    async cancel(orgId, invoiceId, reason) {
      const inv = await repos.invoices.findById(orgId, invoiceId);
      if (!inv) throw new ApiError(404, "INVOICE_NOT_FOUND", `Invoice ${invoiceId} not found`);
      if (["paid", "cancelled", "refunded"].includes(inv.status)) {
        throw new ApiError(409, "INVOICE_INVALID_STATUS", "Invoice cannot be cancelled in its current status");
      }
      const updated = await repos.invoices.update(orgId, invoiceId, {
        status: "cancelled",
        metadata: { ...inv.metadata, cancelledAt: new Date().toISOString(), cancelReason: reason ?? null },
      });
      await repos.eventBus.publish(
        createBossEvent("invoice.cancelled", { invoiceId, reason: reason ?? null }, {
          orgId, businessId: inv.businessId, actorId: "system",
          requestId: invoiceId, correlationId: invoiceId, traceId: invoiceId,
        }),
      );
      return updated;
    },

    async refund(orgId, invoiceId, amountCents, reason) {
      const inv = await repos.invoices.findById(orgId, invoiceId);
      if (!inv) throw new ApiError(404, "INVOICE_NOT_FOUND", `Invoice ${invoiceId} not found`);
      if (inv.status !== "paid") {
        throw new ApiError(409, "INVOICE_INVALID_STATUS", "Only paid invoices can be refunded");
      }
      const updated = await repos.invoices.update(orgId, invoiceId, {
        status: "refunded",
        metadata: { ...inv.metadata, refundedAt: new Date().toISOString(), refundAmountCents: amountCents, refundReason: reason ?? null },
      });
      await repos.eventBus.publish(
        createBossEvent("invoice.refunded", { invoiceId, amountCents, reason: reason ?? null }, {
          orgId, businessId: inv.businessId, actorId: "system",
          requestId: invoiceId, correlationId: invoiceId, traceId: invoiceId,
        }),
      );
      return updated;
    },

    async listOverdue(orgId, businessId) {
      const invoices = await repos.invoices.listByBusiness(orgId, businessId);
      return invoices
        .filter((i) => i.status === "overdue")
        .sort((a, b) => {
          const da = a.dueAt ?? "";
          const db = b.dueAt ?? "";
          return da < db ? -1 : da > db ? 1 : 0;
        });
    },

    async applyCreditNote(orgId, invoiceId, amountCents) {
      const inv = await repos.invoices.findById(orgId, invoiceId);
      if (!inv) throw new ApiError(404, "INVOICE_NOT_FOUND", `Invoice ${invoiceId} not found`);
      const newTotal = Math.max(0, inv.totalCents - amountCents);
      const updated = await repos.invoices.update(orgId, invoiceId, {
        totalCents: newTotal,
        metadata: {
          ...inv.metadata,
          creditAppliedCents: ((inv.metadata["creditAppliedCents"] as number | undefined) ?? 0) + amountCents,
          lastCreditAt: new Date().toISOString(),
        },
      });
      await repos.eventBus.publish(
        createBossEvent("invoice.credit_applied", { invoiceId, amountCents, newTotalCents: newTotal }, {
          orgId, businessId: inv.businessId, actorId: "system",
          requestId: invoiceId, correlationId: invoiceId, traceId: invoiceId,
        }),
      );
      return updated;
    },
  };
}
