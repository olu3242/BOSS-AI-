import type { Invoice, InvoiceStatus, InvoiceLineItem } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { InvoiceRepository } from "../types.js";

interface InvoiceRow {
  id: string;
  org_id: string;
  business_id: string;
  customer_id: string;
  job_id: string | null;
  invoice_number: string;
  status: string;
  line_items: InvoiceLineItem[];
  subtotal_cents: number;
  tax_cents: number;
  discount_cents: number;
  total_cents: number;
  currency: string;
  due_at: string | null;
  sent_at: string | null;
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
  terms: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    customerId: row.customer_id,
    jobId: row.job_id,
    invoiceNumber: row.invoice_number,
    status: row.status as InvoiceStatus,
    lineItems: row.line_items ?? [],
    subtotalCents: row.subtotal_cents,
    taxCents: row.tax_cents,
    discountCents: row.discount_cents,
    totalCents: row.total_cents,
    currency: row.currency,
    dueAt: row.due_at,
    sentAt: row.sent_at,
    paidAt: row.paid_at,
    paymentMethod: row.payment_method,
    notes: row.notes,
    terms: row.terms,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresInvoiceRepository(): InvoiceRepository {
  return {
    async create(input) {
      const rows = await query<InvoiceRow>(
        `INSERT INTO invoices
           (org_id, business_id, customer_id, job_id, invoice_number, status,
            line_items, subtotal_cents, tax_cents, discount_cents, total_cents,
            currency, due_at, sent_at, paid_at, payment_method, notes, terms, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         RETURNING *`,
        [
          input.orgId, input.businessId, input.customerId, input.jobId ?? null,
          input.invoiceNumber, input.status ?? 'draft',
          JSON.stringify(input.lineItems ?? []),
          input.subtotalCents ?? 0, input.taxCents ?? 0,
          input.discountCents ?? 0, input.totalCents ?? 0,
          input.currency ?? 'USD',
          input.dueAt ?? null, input.sentAt ?? null, input.paidAt ?? null,
          input.paymentMethod ?? null, input.notes ?? null, input.terms ?? null,
          JSON.stringify(input.metadata ?? {}),
        ]
      );
      return toInvoice(firstRow(rows));
    },

    async findById(orgId, id) {
      const rows = await query<InvoiceRow>(
        `SELECT * FROM invoices WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      return rows[0] ? toInvoice(rows[0]) : null;
    },

    async update(orgId, id, patch) {
      const rows = await query<InvoiceRow>(
        `UPDATE invoices SET
           status = COALESCE($3, status),
           line_items = COALESCE($4, line_items),
           subtotal_cents = COALESCE($5, subtotal_cents),
           tax_cents = COALESCE($6, tax_cents),
           discount_cents = COALESCE($7, discount_cents),
           total_cents = COALESCE($8, total_cents),
           due_at = COALESCE($9, due_at),
           sent_at = COALESCE($10, sent_at),
           paid_at = COALESCE($11, paid_at),
           payment_method = COALESCE($12, payment_method),
           notes = COALESCE($13, notes),
           terms = COALESCE($14, terms),
           metadata = COALESCE($15, metadata),
           updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [
          orgId, id,
          patch.status ?? null,
          patch.lineItems ? JSON.stringify(patch.lineItems) : null,
          patch.subtotalCents ?? null, patch.taxCents ?? null,
          patch.discountCents ?? null, patch.totalCents ?? null,
          patch.dueAt ?? null, patch.sentAt ?? null, patch.paidAt ?? null,
          patch.paymentMethod ?? null, patch.notes ?? null, patch.terms ?? null,
          patch.metadata ? JSON.stringify(patch.metadata) : null,
        ]
      );
      return toInvoice(firstRow(rows));
    },

    async listByBusiness(orgId, businessId) {
      const rows = await query<InvoiceRow>(
        `SELECT * FROM invoices WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        [orgId, businessId]
      );
      return rows.map(toInvoice);
    },

    async listByCustomer(orgId, customerId) {
      const rows = await query<InvoiceRow>(
        `SELECT * FROM invoices WHERE org_id = $1 AND customer_id = $2 AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        [orgId, customerId]
      );
      return rows.map(toInvoice);
    },

    async softDelete(orgId, id) {
      await query(
        `UPDATE invoices SET deleted_at = now(), updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
    },
  };
}
