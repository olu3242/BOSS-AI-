import type { Lead, LeadStatus } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { LeadRepository } from "../types.js";

interface LeadRow {
  id: string;
  org_id: string;
  business_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  source: string;
  status: string;
  assigned_to: string | null;
  notes: string | null;
  tags: string[];
  estimated_value: string | null;
  converted_customer_id: string | null;
  qualified_at: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    source: row.source,
    status: row.status as LeadStatus,
    assignedTo: row.assigned_to,
    notes: row.notes,
    tags: row.tags ?? [],
    estimatedValue: row.estimated_value !== null ? parseFloat(row.estimated_value) : null,
    convertedCustomerId: row.converted_customer_id,
    qualifiedAt: row.qualified_at,
    convertedAt: row.converted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresLeadRepository(): LeadRepository {
  return {
    async create(input) {
      const rows = await query<LeadRow>(
        `INSERT INTO leads
           (org_id, business_id, first_name, last_name, email, phone,
            source, status, assigned_to, notes, tags, estimated_value,
            converted_customer_id, qualified_at, converted_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING *`,
        [
          input.orgId, input.businessId, input.firstName, input.lastName,
          input.email ?? null, input.phone ?? null,
          input.source ?? "manual", input.status ?? "new",
          input.assignedTo ?? null, input.notes ?? null,
          input.tags ?? [], input.estimatedValue ?? null,
          input.convertedCustomerId ?? null,
          input.qualifiedAt ?? null, input.convertedAt ?? null,
        ]
      );
      return toLead(firstRow(rows));
    },

    async findById(orgId, id) {
      const rows = await query<LeadRow>(
        `SELECT * FROM leads WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      return rows[0] ? toLead(rows[0]) : null;
    },

    async update(orgId, id, patch) {
      const rows = await query<LeadRow>(
        `UPDATE leads SET
           first_name = COALESCE($3, first_name),
           last_name = COALESCE($4, last_name),
           email = COALESCE($5, email),
           phone = COALESCE($6, phone),
           source = COALESCE($7, source),
           status = COALESCE($8, status),
           assigned_to = COALESCE($9, assigned_to),
           notes = COALESCE($10, notes),
           tags = COALESCE($11, tags),
           estimated_value = COALESCE($12, estimated_value),
           converted_customer_id = COALESCE($13, converted_customer_id),
           qualified_at = COALESCE($14, qualified_at),
           converted_at = COALESCE($15, converted_at),
           updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [
          orgId, id,
          patch.firstName ?? null, patch.lastName ?? null,
          patch.email ?? null, patch.phone ?? null,
          patch.source ?? null, patch.status ?? null,
          patch.assignedTo ?? null, patch.notes ?? null,
          patch.tags ?? null, patch.estimatedValue ?? null,
          patch.convertedCustomerId ?? null,
          patch.qualifiedAt ?? null, patch.convertedAt ?? null,
        ]
      );
      return toLead(firstRow(rows));
    },

    async updateStatus(orgId, id, status) {
      const rows = await query<LeadRow>(
        `UPDATE leads SET status = $3, updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [orgId, id, status]
      );
      return toLead(firstRow(rows));
    },

    async delete(orgId, id) {
      await query(
        `UPDATE leads SET deleted_at = now(), updated_at = now()
         WHERE org_id = $1 AND id = $2`,
        [orgId, id]
      );
    },

    async listByBusinessId(orgId, businessId) {
      const rows = await query<LeadRow>(
        `SELECT * FROM leads WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        [orgId, businessId]
      );
      return rows.map(toLead);
    },

    async listByStatus(orgId, businessId, status) {
      const rows = await query<LeadRow>(
        `SELECT * FROM leads WHERE org_id = $1 AND business_id = $2 AND status = $3 AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        [orgId, businessId, status]
      );
      return rows.map(toLead);
    },

    async search(orgId, businessId, q) {
      const like = `%${q.toLowerCase()}%`;
      const rows = await query<LeadRow>(
        `SELECT * FROM leads
         WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL
           AND (lower(first_name) LIKE $3 OR lower(last_name) LIKE $3
                OR lower(COALESCE(email,'')) LIKE $3 OR lower(COALESCE(phone,'')) LIKE $3)
         ORDER BY created_at DESC`,
        [orgId, businessId, like]
      );
      return rows.map(toLead);
    },
  };
}
