import type { Opportunity, OpportunityStage } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { OpportunityRepository } from "../types.js";

interface OpportunityRow {
  id: string;
  org_id: string;
  business_id: string;
  customer_id: string | null;
  lead_id: string | null;
  title: string;
  stage: string;
  value_cents: number;
  currency: string;
  probability: number;
  expected_close_date: string | null;
  assigned_to: string | null;
  source: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toOpportunity(row: OpportunityRow): Opportunity {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    customerId: row.customer_id,
    leadId: row.lead_id,
    title: row.title,
    stage: row.stage as OpportunityStage,
    valueCents: row.value_cents,
    currency: row.currency,
    probability: row.probability,
    expectedCloseDate: row.expected_close_date,
    assignedTo: row.assigned_to,
    source: row.source,
    notes: row.notes,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresOpportunityRepository(): OpportunityRepository {
  return {
    async create(input) {
      const rows = await query<OpportunityRow>(
        `INSERT INTO opportunities
           (org_id, business_id, customer_id, lead_id, title, stage,
            value_cents, currency, probability, expected_close_date,
            assigned_to, source, notes, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING *`,
        [
          input.orgId, input.businessId,
          input.customerId ?? null, input.leadId ?? null,
          input.title, input.stage ?? "prospecting",
          input.valueCents ?? 0, input.currency ?? "USD",
          input.probability ?? 0,
          input.expectedCloseDate ?? null,
          input.assignedTo ?? null, input.source ?? null,
          input.notes ?? null, input.tags ?? [],
        ]
      );
      return toOpportunity(firstRow(rows));
    },

    async findById(orgId, id) {
      const rows = await query<OpportunityRow>(
        `SELECT * FROM opportunities WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      return rows[0] ? toOpportunity(rows[0]) : null;
    },

    async update(orgId, id, patch) {
      const rows = await query<OpportunityRow>(
        `UPDATE opportunities
         SET title               = COALESCE($3, title),
             stage               = COALESCE($4, stage),
             value_cents         = COALESCE($5, value_cents),
             currency            = COALESCE($6, currency),
             probability         = COALESCE($7, probability),
             expected_close_date = COALESCE($8, expected_close_date),
             assigned_to         = COALESCE($9, assigned_to),
             source              = COALESCE($10, source),
             notes               = COALESCE($11, notes),
             tags                = COALESCE($12, tags),
             customer_id         = COALESCE($13, customer_id),
             updated_at          = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [
          orgId, id,
          patch.title ?? null, patch.stage ?? null,
          patch.valueCents ?? null, patch.currency ?? null,
          patch.probability ?? null, patch.expectedCloseDate ?? null,
          patch.assignedTo ?? null, patch.source ?? null,
          patch.notes ?? null, patch.tags ?? null,
          patch.customerId ?? null,
        ]
      );
      return toOpportunity(firstRow(rows));
    },

    async delete(orgId, id) {
      await query(
        `UPDATE opportunities SET deleted_at = now(), updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
    },

    async listByBusinessId(orgId, businessId) {
      const rows = await query<OpportunityRow>(
        `SELECT * FROM opportunities
         WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        [orgId, businessId]
      );
      return rows.map(toOpportunity);
    },

    async listByStage(orgId, businessId, stage) {
      const rows = await query<OpportunityRow>(
        `SELECT * FROM opportunities
         WHERE org_id = $1 AND business_id = $2 AND stage = $3 AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        [orgId, businessId, stage]
      );
      return rows.map(toOpportunity);
    },

    async listByCustomer(orgId, customerId) {
      const rows = await query<OpportunityRow>(
        `SELECT * FROM opportunities
         WHERE org_id = $1 AND customer_id = $2 AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        [orgId, customerId]
      );
      return rows.map(toOpportunity);
    },
  };
}
