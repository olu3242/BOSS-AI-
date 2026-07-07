import type { Estimate, EstimateStatus } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { EstimateRepository } from "../types.js";

interface EstimateRow {
  id: string;
  org_id: string;
  business_id: string;
  customer_id: string | null;
  estimate_number: string;
  status: string;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price_cents: number;
    total_cents: number;
  }>;
  subtotal_cents: number;
  tax_cents: number;
  discount_cents: number;
  total_cents: number;
  currency: string;
  valid_until: string | null;
  converted_invoice_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toEstimate(row: EstimateRow): Estimate {
  const lineItems = (row.line_items ?? []).map((li) => ({
    description: li.description,
    quantity: li.quantity,
    unitPriceCents: li.unit_price_cents,
    totalCents: li.total_cents,
  }));
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    customerId: row.customer_id,
    estimateNumber: row.estimate_number,
    status: row.status as EstimateStatus,
    lineItems,
    subtotalCents: row.subtotal_cents,
    taxCents: row.tax_cents,
    discountCents: row.discount_cents,
    totalCents: row.total_cents,
    currency: row.currency,
    validUntil: row.valid_until,
    convertedInvoiceId: row.converted_invoice_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresEstimateRepository(): EstimateRepository {
  return {
    async create(input) {
      const rows = await query<EstimateRow>(
        `INSERT INTO estimates
           (org_id, business_id, customer_id, estimate_number, status,
            line_items, subtotal_cents, tax_cents, discount_cents, total_cents,
            currency, valid_until, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING *`,
        [
          input.orgId, input.businessId,
          input.customerId ?? null,
          input.estimateNumber,
          input.status ?? "draft",
          JSON.stringify(
            (input.lineItems ?? []).map((li) => ({
              description: li.description,
              quantity: li.quantity,
              unit_price_cents: li.unitPriceCents,
              total_cents: li.totalCents,
            }))
          ),
          input.subtotalCents ?? 0,
          input.taxCents ?? 0,
          input.discountCents ?? 0,
          input.totalCents ?? 0,
          input.currency ?? "USD",
          input.validUntil ?? null,
          input.notes ?? null,
        ]
      );
      return toEstimate(firstRow(rows));
    },

    async findById(orgId, id) {
      const rows = await query<EstimateRow>(
        `SELECT * FROM estimates WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      return rows[0] ? toEstimate(rows[0]) : null;
    },

    async findByNumber(orgId, estimateNumber) {
      const rows = await query<EstimateRow>(
        `SELECT * FROM estimates WHERE org_id = $1 AND estimate_number = $2 AND deleted_at IS NULL`,
        [orgId, estimateNumber]
      );
      return rows[0] ? toEstimate(rows[0]) : null;
    },

    async update(orgId, id, patch) {
      const rows = await query<EstimateRow>(
        `UPDATE estimates
         SET status               = COALESCE($3, status),
             line_items           = COALESCE($4, line_items),
             subtotal_cents       = COALESCE($5, subtotal_cents),
             tax_cents            = COALESCE($6, tax_cents),
             discount_cents       = COALESCE($7, discount_cents),
             total_cents          = COALESCE($8, total_cents),
             valid_until          = COALESCE($9, valid_until),
             converted_invoice_id = COALESCE($10, converted_invoice_id),
             notes                = COALESCE($11, notes),
             customer_id          = COALESCE($12, customer_id),
             updated_at           = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [
          orgId, id,
          patch.status ?? null,
          patch.lineItems
            ? JSON.stringify(
                patch.lineItems.map((li) => ({
                  description: li.description,
                  quantity: li.quantity,
                  unit_price_cents: li.unitPriceCents,
                  total_cents: li.totalCents,
                }))
              )
            : null,
          patch.subtotalCents ?? null,
          patch.taxCents ?? null,
          patch.discountCents ?? null,
          patch.totalCents ?? null,
          patch.validUntil ?? null,
          patch.convertedInvoiceId ?? null,
          patch.notes ?? null,
          patch.customerId ?? null,
        ]
      );
      return toEstimate(firstRow(rows));
    },

    async delete(orgId, id) {
      await query(
        `UPDATE estimates SET deleted_at = now(), updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
    },

    async listByBusinessId(orgId, businessId) {
      const rows = await query<EstimateRow>(
        `SELECT * FROM estimates
         WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        [orgId, businessId]
      );
      return rows.map(toEstimate);
    },

    async listByCustomer(orgId, customerId) {
      const rows = await query<EstimateRow>(
        `SELECT * FROM estimates
         WHERE org_id = $1 AND customer_id = $2 AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        [orgId, customerId]
      );
      return rows.map(toEstimate);
    },
  };
}
