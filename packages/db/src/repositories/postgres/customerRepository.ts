import type { Customer, CustomerInteraction, CustomerStatus, CustomerInteractionType } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { CustomerRepository, CustomerInteractionRepository } from "../types.js";

interface CustomerRow {
  id: string;
  org_id: string;
  business_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  source: string | null;
  tags: string[];
  notes: string | null;
  total_revenue: string;
  health_score: string | null;
  last_contact_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    status: row.status as CustomerStatus,
    source: row.source as Customer["source"],
    tags: row.tags ?? [],
    notes: row.notes,
    totalRevenue: parseFloat(row.total_revenue ?? "0"),
    healthScore: row.health_score !== null ? parseFloat(row.health_score) : null,
    lastContactAt: row.last_contact_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresCustomerRepository(): CustomerRepository {
  return {
    async create(input) {
      const rows = await query<CustomerRow>(
        `INSERT INTO customers
           (org_id, business_id, first_name, last_name, email, phone, address,
            status, source, tags, notes, total_revenue, health_score, last_contact_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING *`,
        [
          input.orgId, input.businessId, input.firstName, input.lastName,
          input.email ?? null, input.phone ?? null, input.address ?? null,
          input.status ?? "prospect", input.source ?? null,
          input.tags ?? [], input.notes ?? null,
          input.totalRevenue ?? 0, input.healthScore ?? null,
          input.lastContactAt ?? null,
        ]
      );
      return toCustomer(firstRow(rows));
    },

    async findById(orgId, id) {
      const rows = await query<CustomerRow>(
        `SELECT * FROM customers WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      return rows[0] ? toCustomer(rows[0]) : null;
    },

    async update(orgId, id, patch) {
      const rows = await query<CustomerRow>(
        `UPDATE customers
         SET first_name      = COALESCE($3, first_name),
             last_name       = COALESCE($4, last_name),
             email           = COALESCE($5, email),
             phone           = COALESCE($6, phone),
             address         = COALESCE($7, address),
             status          = COALESCE($8, status),
             source          = COALESCE($9, source),
             tags            = COALESCE($10, tags),
             notes           = COALESCE($11, notes),
             health_score    = COALESCE($12, health_score),
             last_contact_at = COALESCE($13, last_contact_at),
             updated_at      = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [
          orgId, id,
          patch.firstName ?? null, patch.lastName ?? null,
          patch.email ?? null, patch.phone ?? null, patch.address ?? null,
          patch.status ?? null, patch.source ?? null, patch.tags ?? null,
          patch.notes ?? null, patch.healthScore ?? null, patch.lastContactAt ?? null,
        ]
      );
      return toCustomer(firstRow(rows));
    },

    async updateStatus(orgId, id, status) {
      const rows = await query<CustomerRow>(
        `UPDATE customers SET status = $3, updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING *`,
        [orgId, id, status]
      );
      return toCustomer(firstRow(rows));
    },

    async updateRevenue(orgId, id, totalRevenue) {
      const rows = await query<CustomerRow>(
        `UPDATE customers SET total_revenue = $3, updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING *`,
        [orgId, id, totalRevenue]
      );
      return toCustomer(firstRow(rows));
    },

    async delete(orgId, id) {
      await query(
        `UPDATE customers SET deleted_at = now(), updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
    },

    async listByBusinessId(orgId, businessId) {
      const rows = await query<CustomerRow>(
        `SELECT * FROM customers
         WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        [orgId, businessId]
      );
      return rows.map(toCustomer);
    },

    async search(orgId, businessId, searchQuery) {
      const pattern = `%${searchQuery.toLowerCase()}%`;
      const rows = await query<CustomerRow>(
        `SELECT * FROM customers
         WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL
           AND (
             lower(first_name || ' ' || last_name) LIKE $3
             OR lower(email) LIKE $3
             OR lower(phone) LIKE $3
           )
         ORDER BY created_at DESC
         LIMIT 50`,
        [orgId, businessId, pattern]
      );
      return rows.map(toCustomer);
    },
  };
}

// ── Customer Interactions ─────────────────────────────

interface InteractionRow {
  id: string;
  org_id: string;
  business_id: string;
  customer_id: string;
  type: string;
  summary: string;
  metadata: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toInteraction(row: InteractionRow): CustomerInteraction {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    customerId: row.customer_id,
    type: row.type as CustomerInteractionType,
    summary: row.summary,
    metadata: row.metadata ?? {},
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresCustomerInteractionRepository(): CustomerInteractionRepository {
  return {
    async create(input) {
      const rows = await query<InteractionRow>(
        `INSERT INTO customer_interactions
           (org_id, business_id, customer_id, type, summary, metadata, occurred_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING *`,
        [
          input.orgId, input.businessId, input.customerId,
          input.type, input.summary, JSON.stringify(input.metadata ?? {}),
          input.occurredAt,
        ]
      );
      return toInteraction(firstRow(rows));
    },

    async listByCustomerId(orgId, customerId) {
      const rows = await query<InteractionRow>(
        `SELECT * FROM customer_interactions
         WHERE org_id = $1 AND customer_id = $2 AND deleted_at IS NULL
         ORDER BY occurred_at DESC`,
        [orgId, customerId]
      );
      return rows.map(toInteraction);
    },

    async listByBusinessId(orgId, businessId, limit = 50) {
      const rows = await query<InteractionRow>(
        `SELECT * FROM customer_interactions
         WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL
         ORDER BY occurred_at DESC LIMIT $3`,
        [orgId, businessId, limit]
      );
      return rows.map(toInteraction);
    },

    async countByType(orgId, customerId, type) {
      const rows = await query<{ count: string }>(
        `SELECT count(*)::text FROM customer_interactions
         WHERE org_id = $1 AND customer_id = $2 AND type = $3 AND deleted_at IS NULL`,
        [orgId, customerId, type]
      );
      return parseInt(rows[0]?.count ?? "0", 10);
    },
  };
}
