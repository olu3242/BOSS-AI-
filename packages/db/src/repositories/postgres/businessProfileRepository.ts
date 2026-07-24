import type { BusinessProfile } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { BusinessProfileRepository } from "../types.js";

interface BusinessProfileRow {
  id: string;
  org_id: string;
  business_id: string;
  business_name: string;
  business_type: string;
  years_operating: number;
  employee_count: number;
  location_count: number;
  business_hours: string;
  services: string | null;
  existing_tools: string[];
  ai_agents: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toProfile(row: BusinessProfileRow): BusinessProfile {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    businessName: row.business_name,
    businessType: row.business_type,
    yearsOperating: row.years_operating,
    employeeCount: row.employee_count,
    locationCount: row.location_count,
    businessHours: row.business_hours,
    services: row.services ?? null,
    existingTools: row.existing_tools ?? [],
    aiAgents: row.ai_agents ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresBusinessProfileRepository(): BusinessProfileRepository {
  return {
    async upsert(input) {
      const rows = await query<BusinessProfileRow>(
        `INSERT INTO business_profiles
           (org_id, business_id, business_name, business_type, years_operating, employee_count, location_count, business_hours, services, existing_tools, ai_agents)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (business_id) DO UPDATE SET
           business_name = EXCLUDED.business_name,
           business_type = EXCLUDED.business_type,
           years_operating = EXCLUDED.years_operating,
           employee_count = EXCLUDED.employee_count,
           location_count = EXCLUDED.location_count,
           business_hours = EXCLUDED.business_hours,
           services = EXCLUDED.services,
           existing_tools = EXCLUDED.existing_tools,
           ai_agents = EXCLUDED.ai_agents,
           updated_at = now()
         RETURNING *`,
        [
          input.orgId,
          input.businessId,
          input.businessName,
          input.businessType,
          input.yearsOperating,
          input.employeeCount,
          input.locationCount,
          input.businessHours,
          input.services ?? null,
          input.existingTools ?? [],
          input.aiAgents ?? [],
        ]
      );
      return toProfile(firstRow(rows));
    },
    async findByBusinessId(orgId, businessId) {
      const rows = await query<BusinessProfileRow>(
        `SELECT * FROM business_profiles WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL`,
        [orgId, businessId]
      );
      return rows[0] ? toProfile(rows[0]) : null;
    },
  };
}
