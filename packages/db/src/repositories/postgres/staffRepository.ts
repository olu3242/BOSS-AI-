import type { StaffMember, StaffStatus } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { StaffRepository } from "../types.js";

interface StaffRow {
  id: string;
  org_id: string;
  business_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  department: string | null;
  status: string;
  hire_date: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toStaff(row: StaffRow): StaffMember {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    department: row.department,
    status: row.status as StaffStatus,
    hireDate: row.hire_date,
    tags: row.tags ?? [],
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresStaffRepository(): StaffRepository {
  return {
    async create(input) {
      const rows = await query<StaffRow>(
        `INSERT INTO staff
           (org_id, business_id, user_id, first_name, last_name, email, phone,
            role, department, status, hire_date, tags, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING *`,
        [
          input.orgId, input.businessId, input.userId,
          input.firstName, input.lastName,
          input.email ?? null, input.phone ?? null,
          input.role, input.department ?? null,
          input.status ?? "active",
          input.hireDate ?? null,
          input.tags ?? [],
          input.notes ?? null,
        ]
      );
      return toStaff(firstRow(rows));
    },

    async findById(orgId, id) {
      const rows = await query<StaffRow>(
        `SELECT * FROM staff WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      return rows[0] ? toStaff(rows[0]) : null;
    },

    async update(orgId, id, patch) {
      const rows = await query<StaffRow>(
        `UPDATE staff
         SET first_name  = COALESCE($3, first_name),
             last_name   = COALESCE($4, last_name),
             email       = COALESCE($5, email),
             phone       = COALESCE($6, phone),
             role        = COALESCE($7, role),
             department  = COALESCE($8, department),
             status      = COALESCE($9, status),
             hire_date   = COALESCE($10, hire_date),
             tags        = COALESCE($11, tags),
             notes       = COALESCE($12, notes),
             updated_at  = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [
          orgId, id,
          patch.firstName ?? null, patch.lastName ?? null,
          patch.email ?? null, patch.phone ?? null,
          patch.role ?? null, patch.department ?? null,
          patch.status ?? null, patch.hireDate ?? null,
          patch.tags ?? null, patch.notes ?? null,
        ]
      );
      return toStaff(firstRow(rows));
    },

    async delete(orgId, id) {
      await query(
        `UPDATE staff SET deleted_at = now(), updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
    },

    async listByBusinessId(orgId, businessId) {
      const rows = await query<StaffRow>(
        `SELECT * FROM staff
         WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL
         ORDER BY first_name, last_name`,
        [orgId, businessId]
      );
      return rows.map(toStaff);
    },

    async findByUserId(orgId, userId) {
      const rows = await query<StaffRow>(
        `SELECT * FROM staff WHERE org_id = $1 AND user_id = $2 AND deleted_at IS NULL`,
        [orgId, userId]
      );
      return rows[0] ? toStaff(rows[0]) : null;
    },
  };
}
