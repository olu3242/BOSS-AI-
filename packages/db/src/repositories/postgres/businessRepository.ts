import type { Business } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { BusinessRepository } from "../types.js";

interface BusinessRow {
  id: string;
  org_id: string;
  name: string;
  industry: string;
  employee_count: number;
  annual_revenue: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    industry: row.industry,
    employeeCount: row.employee_count,
    annualRevenue: Number(row.annual_revenue),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresBusinessRepository(): BusinessRepository {
  return {
    async create(input) {
      const rows = await query<BusinessRow>(
        `INSERT INTO businesses (org_id, name, industry, employee_count, annual_revenue)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [input.orgId, input.name, input.industry, input.employeeCount, input.annualRevenue]
      );
      return toBusiness(firstRow(rows));
    },
    async findById(orgId, id) {
      const rows = await query<BusinessRow>(
        `SELECT * FROM businesses WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      return rows[0] ? toBusiness(rows[0]) : null;
    },
    async list(orgId) {
      const rows = await query<BusinessRow>(
        `SELECT * FROM businesses WHERE org_id = $1 AND deleted_at IS NULL ORDER BY created_at`,
        [orgId]
      );
      return rows.map(toBusiness);
    },
  };
}
