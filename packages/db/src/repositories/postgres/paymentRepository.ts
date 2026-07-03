import type { Payment, PaymentMethod, PaymentStatus } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { PaymentRepository } from "../types.js";

interface PaymentRow {
  id: string;
  org_id: string;
  business_id: string;
  customer_id: string;
  invoice_id: string;
  amount_cents: number;
  currency: string;
  method: string;
  status: string;
  reference: string | null;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    customerId: row.customer_id,
    invoiceId: row.invoice_id,
    amountCents: row.amount_cents,
    currency: row.currency,
    method: row.method as PaymentMethod,
    status: row.status as PaymentStatus,
    reference: row.reference,
    notes: row.notes,
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresPaymentRepository(): PaymentRepository {
  return {
    async create(input) {
      const rows = await query<PaymentRow>(
        `INSERT INTO payments (org_id, business_id, customer_id, invoice_id, amount_cents, currency, method, status, reference, notes, paid_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [
          input.orgId, input.businessId, input.customerId, input.invoiceId,
          input.amountCents, input.currency ?? 'USD', input.method, input.status ?? 'pending',
          input.reference ?? null, input.notes ?? null, input.paidAt ?? null,
        ]
      );
      return toPayment(firstRow(rows));
    },

    async findById(orgId, id) {
      const rows = await query<PaymentRow>(
        `SELECT * FROM payments WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      return rows[0] ? toPayment(rows[0]) : null;
    },

    async update(orgId, id, patch) {
      const rows = await query<PaymentRow>(
        `UPDATE payments SET
           status = COALESCE($3, status),
           reference = COALESCE($4, reference),
           notes = COALESCE($5, notes),
           paid_at = COALESCE($6, paid_at),
           updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [orgId, id, patch.status ?? null, patch.reference ?? null, patch.notes ?? null, patch.paidAt ?? null]
      );
      return toPayment(firstRow(rows));
    },

    async listByBusiness(orgId, businessId) {
      const rows = await query<PaymentRow>(
        `SELECT * FROM payments WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC`,
        [orgId, businessId]
      );
      return rows.map(toPayment);
    },

    async listByInvoice(orgId, invoiceId) {
      const rows = await query<PaymentRow>(
        `SELECT * FROM payments WHERE org_id = $1 AND invoice_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC`,
        [orgId, invoiceId]
      );
      return rows.map(toPayment);
    },

    async softDelete(orgId, id) {
      await query(
        `UPDATE payments SET deleted_at = now(), updated_at = now() WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
    },
  };
}
