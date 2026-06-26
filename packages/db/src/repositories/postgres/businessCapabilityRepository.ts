import type { BusinessCapabilityAssessment } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { BusinessCapabilityRepository } from "../types.js";

interface CapabilityRow {
  id: string;
  org_id: string;
  business_id: string;
  capability_key: string;
  current_maturity: BusinessCapabilityAssessment["currentMaturity"];
  business_importance: BusinessCapabilityAssessment["businessImportance"];
  automation_potential: BusinessCapabilityAssessment["automationPotential"];
  dependencies: string[];
  owner: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toCapability(row: CapabilityRow): BusinessCapabilityAssessment {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    capabilityKey: row.capability_key,
    currentMaturity: row.current_maturity,
    businessImportance: row.business_importance,
    automationPotential: row.automation_potential,
    dependencies: row.dependencies,
    owner: row.owner,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresBusinessCapabilityRepository(): BusinessCapabilityRepository {
  return {
    async upsert(input) {
      const rows = await query<CapabilityRow>(
        `INSERT INTO business_capabilities
           (org_id, business_id, capability_key, current_maturity, business_importance, automation_potential, dependencies, owner)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (business_id, capability_key) DO UPDATE SET
           current_maturity = EXCLUDED.current_maturity,
           business_importance = EXCLUDED.business_importance,
           automation_potential = EXCLUDED.automation_potential,
           dependencies = EXCLUDED.dependencies,
           owner = EXCLUDED.owner,
           updated_at = now()
         RETURNING *`,
        [
          input.orgId,
          input.businessId,
          input.capabilityKey,
          input.currentMaturity,
          input.businessImportance,
          input.automationPotential,
          JSON.stringify(input.dependencies),
          input.owner,
        ]
      );
      return toCapability(firstRow(rows));
    },
    async listByBusinessId(orgId, businessId) {
      const rows = await query<CapabilityRow>(
        `SELECT * FROM business_capabilities WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL ORDER BY capability_key`,
        [orgId, businessId]
      );
      return rows.map(toCapability);
    },
  };
}
