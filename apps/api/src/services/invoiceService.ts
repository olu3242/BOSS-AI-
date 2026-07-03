import type { Invoice, InvoiceStatus, InvoiceLineItem } from "@boss/types";
import type { InvoicePatch } from "@boss/db";
import { randomUUID } from "node:crypto";
import type { RepositoryContainer } from "../container.js";

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
  };
}
