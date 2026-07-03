import type { Job, JobStatus, JobPriority } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { JobRepository } from "../types.js";

interface JobRow {
  id: string;
  org_id: string;
  business_id: string;
  customer_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  estimated_duration_minutes: number | null;
  actual_duration_minutes: number | null;
  location: string | null;
  notes: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toJob(row: JobRow): Job {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    customerId: row.customer_id,
    title: row.title,
    description: row.description,
    status: row.status as JobStatus,
    priority: row.priority as JobPriority,
    assignedTo: row.assigned_to,
    scheduledAt: row.scheduled_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    actualDurationMinutes: row.actual_duration_minutes,
    location: row.location,
    notes: row.notes,
    tags: row.tags ?? [],
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresJobRepository(): JobRepository {
  return {
    async create(input) {
      const rows = await query<JobRow>(
        `INSERT INTO jobs
           (org_id, business_id, customer_id, title, description, status, priority,
            assigned_to, scheduled_at, started_at, completed_at,
            estimated_duration_minutes, actual_duration_minutes, location, notes, tags, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         RETURNING *`,
        [
          input.orgId, input.businessId, input.customerId ?? null,
          input.title, input.description ?? null,
          input.status ?? 'scheduled', input.priority ?? 'normal',
          input.assignedTo ?? null, input.scheduledAt ?? null,
          input.startedAt ?? null, input.completedAt ?? null,
          input.estimatedDurationMinutes ?? null, input.actualDurationMinutes ?? null,
          input.location ?? null, input.notes ?? null,
          JSON.stringify(input.tags ?? []), JSON.stringify(input.metadata ?? {}),
        ]
      );
      return toJob(firstRow(rows));
    },

    async findById(orgId, id) {
      const rows = await query<JobRow>(
        `SELECT * FROM jobs WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      return rows[0] ? toJob(rows[0]) : null;
    },

    async update(orgId, id, patch) {
      const rows = await query<JobRow>(
        `UPDATE jobs SET
           title = COALESCE($3, title),
           description = COALESCE($4, description),
           status = COALESCE($5, status),
           priority = COALESCE($6, priority),
           assigned_to = COALESCE($7, assigned_to),
           scheduled_at = COALESCE($8, scheduled_at),
           started_at = COALESCE($9, started_at),
           completed_at = COALESCE($10, completed_at),
           estimated_duration_minutes = COALESCE($11, estimated_duration_minutes),
           actual_duration_minutes = COALESCE($12, actual_duration_minutes),
           location = COALESCE($13, location),
           notes = COALESCE($14, notes),
           tags = COALESCE($15, tags),
           metadata = COALESCE($16, metadata),
           customer_id = COALESCE($17, customer_id),
           updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [
          orgId, id,
          patch.title ?? null, patch.description ?? null,
          patch.status ?? null, patch.priority ?? null,
          patch.assignedTo ?? null, patch.scheduledAt ?? null,
          patch.startedAt ?? null, patch.completedAt ?? null,
          patch.estimatedDurationMinutes ?? null, patch.actualDurationMinutes ?? null,
          patch.location ?? null, patch.notes ?? null,
          patch.tags ? JSON.stringify(patch.tags) : null,
          patch.metadata ? JSON.stringify(patch.metadata) : null,
          patch.customerId ?? null,
        ]
      );
      return toJob(firstRow(rows));
    },

    async listByBusiness(orgId, businessId) {
      const rows = await query<JobRow>(
        `SELECT * FROM jobs WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL
         ORDER BY COALESCE(scheduled_at, created_at) DESC`,
        [orgId, businessId]
      );
      return rows.map(toJob);
    },

    async listByCustomer(orgId, customerId) {
      const rows = await query<JobRow>(
        `SELECT * FROM jobs WHERE org_id = $1 AND customer_id = $2 AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        [orgId, customerId]
      );
      return rows.map(toJob);
    },

    async softDelete(orgId, id) {
      await query(
        `UPDATE jobs SET deleted_at = now(), updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
    },
  };
}
