import type { CustomerReview, ReviewStatus, ReviewSource } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { ReviewRepository } from "../types.js";

interface ReviewRow {
  id: string;
  org_id: string;
  business_id: string;
  customer_id: string;
  job_id: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  source: string;
  response: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toReview(row: ReviewRow): CustomerReview {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    customerId: row.customer_id,
    jobId: row.job_id,
    rating: row.rating,
    title: row.title,
    body: row.body,
    status: row.status as ReviewStatus,
    source: row.source as ReviewSource,
    response: row.response,
    respondedAt: row.responded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresReviewRepository(): ReviewRepository {
  return {
    async create(input) {
      const rows = await query<ReviewRow>(
        `INSERT INTO customer_reviews (org_id, business_id, customer_id, job_id, rating, title, body, status, source, response, responded_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [
          input.orgId, input.businessId, input.customerId, input.jobId ?? null,
          input.rating, input.title ?? null, input.body ?? null,
          input.status ?? 'pending', input.source ?? 'internal',
          input.response ?? null, input.respondedAt ?? null,
        ]
      );
      return toReview(firstRow(rows));
    },

    async findById(orgId, id) {
      const rows = await query<ReviewRow>(
        `SELECT * FROM customer_reviews WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      return rows[0] ? toReview(rows[0]) : null;
    },

    async update(orgId, id, patch) {
      const rows = await query<ReviewRow>(
        `UPDATE customer_reviews SET
           status = COALESCE($3, status),
           response = COALESCE($4, response),
           responded_at = COALESCE($5, responded_at),
           updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [orgId, id, patch.status ?? null, patch.response ?? null, patch.respondedAt ?? null]
      );
      return toReview(firstRow(rows));
    },

    async listByBusiness(orgId, businessId) {
      const rows = await query<ReviewRow>(
        `SELECT * FROM customer_reviews WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC`,
        [orgId, businessId]
      );
      return rows.map(toReview);
    },

    async softDelete(orgId, id) {
      await query(
        `UPDATE customer_reviews SET deleted_at = now(), updated_at = now() WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
    },
  };
}
