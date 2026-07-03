import type { Appointment, AppointmentStatus } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { AppointmentRepository } from "../types.js";

interface AppointmentRow {
  id: string;
  org_id: string;
  business_id: string;
  customer_id: string | null;
  job_id: string | null;
  title: string;
  notes: string | null;
  status: string;
  start_at: string;
  end_at: string;
  location: string | null;
  assigned_to: string | null;
  reminder_sent: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    customerId: row.customer_id,
    jobId: row.job_id,
    title: row.title,
    notes: row.notes,
    status: row.status as AppointmentStatus,
    startAt: row.start_at,
    endAt: row.end_at,
    location: row.location,
    assignedTo: row.assigned_to,
    reminderSent: row.reminder_sent,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresAppointmentRepository(): AppointmentRepository {
  return {
    async create(input) {
      const rows = await query<AppointmentRow>(
        `INSERT INTO appointments
           (org_id, business_id, customer_id, job_id, title, notes, status,
            start_at, end_at, location, assigned_to, reminder_sent, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING *`,
        [
          input.orgId, input.businessId, input.customerId ?? null, input.jobId ?? null,
          input.title, input.notes ?? null, input.status ?? 'scheduled',
          input.startAt, input.endAt, input.location ?? null,
          input.assignedTo ?? null, input.reminderSent ?? false,
          JSON.stringify(input.metadata ?? {}),
        ]
      );
      return toAppointment(firstRow(rows));
    },

    async findById(orgId, id) {
      const rows = await query<AppointmentRow>(
        `SELECT * FROM appointments WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      return rows[0] ? toAppointment(rows[0]) : null;
    },

    async update(orgId, id, patch) {
      const rows = await query<AppointmentRow>(
        `UPDATE appointments SET
           title = COALESCE($3, title),
           notes = COALESCE($4, notes),
           status = COALESCE($5, status),
           start_at = COALESCE($6, start_at),
           end_at = COALESCE($7, end_at),
           location = COALESCE($8, location),
           assigned_to = COALESCE($9, assigned_to),
           reminder_sent = COALESCE($10, reminder_sent),
           metadata = COALESCE($11, metadata),
           customer_id = COALESCE($12, customer_id),
           job_id = COALESCE($13, job_id),
           updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [
          orgId, id,
          patch.title ?? null, patch.notes ?? null,
          patch.status ?? null, patch.startAt ?? null, patch.endAt ?? null,
          patch.location ?? null, patch.assignedTo ?? null,
          patch.reminderSent ?? null,
          patch.metadata ? JSON.stringify(patch.metadata) : null,
          patch.customerId ?? null, patch.jobId ?? null,
        ]
      );
      return toAppointment(firstRow(rows));
    },

    async listByBusiness(orgId, businessId) {
      const rows = await query<AppointmentRow>(
        `SELECT * FROM appointments WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL
         ORDER BY start_at ASC`,
        [orgId, businessId]
      );
      return rows.map(toAppointment);
    },

    async listByCustomer(orgId, customerId) {
      const rows = await query<AppointmentRow>(
        `SELECT * FROM appointments WHERE org_id = $1 AND customer_id = $2 AND deleted_at IS NULL
         ORDER BY start_at ASC`,
        [orgId, customerId]
      );
      return rows.map(toAppointment);
    },

    async softDelete(orgId, id) {
      await query(
        `UPDATE appointments SET deleted_at = now(), updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
    },
  };
}
