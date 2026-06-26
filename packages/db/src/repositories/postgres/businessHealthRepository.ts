import type { BusinessHealth, BusinessHealthDimension, HealthDimensionKey } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { BusinessHealthRepository } from "../types.js";

interface HealthRow {
  id: string;
  org_id: string;
  business_id: string;
  overall_score: string;
  generated_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface DimensionRow {
  id: string;
  org_id: string;
  business_health_id: string;
  dimension_key: HealthDimensionKey;
  score: string;
  confidence: string;
  trend: BusinessHealthDimension["trend"];
  evidence: string[];
  status: BusinessHealthDimension["status"];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toHealth(row: HealthRow): BusinessHealth {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    overallScore: Number(row.overall_score),
    generatedAt: row.generated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function toDimension(row: DimensionRow): BusinessHealthDimension {
  return {
    id: row.id,
    orgId: row.org_id,
    businessHealthId: row.business_health_id,
    dimensionKey: row.dimension_key,
    score: Number(row.score),
    confidence: Number(row.confidence),
    trend: row.trend,
    evidence: row.evidence,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresBusinessHealthRepository(): BusinessHealthRepository {
  return {
    async upsert(input) {
      const rows = await query<HealthRow>(
        `INSERT INTO business_health (org_id, business_id, overall_score, generated_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (business_id) DO UPDATE SET
           overall_score = EXCLUDED.overall_score,
           generated_at = EXCLUDED.generated_at,
           updated_at = now()
         RETURNING *`,
        [input.orgId, input.businessId, input.overallScore, input.generatedAt]
      );
      return toHealth(firstRow(rows));
    },
    async findByBusinessId(orgId, businessId) {
      const rows = await query<HealthRow>(
        `SELECT * FROM business_health WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL`,
        [orgId, businessId]
      );
      return rows[0] ? toHealth(rows[0]) : null;
    },
    async upsertDimension(input) {
      const rows = await query<DimensionRow>(
        `INSERT INTO business_health_dimensions
           (org_id, business_health_id, dimension_key, score, confidence, trend, evidence, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (business_health_id, dimension_key) DO UPDATE SET
           score = EXCLUDED.score,
           confidence = EXCLUDED.confidence,
           trend = EXCLUDED.trend,
           evidence = EXCLUDED.evidence,
           status = EXCLUDED.status,
           updated_at = now()
         RETURNING *`,
        [
          input.orgId,
          input.businessHealthId,
          input.dimensionKey,
          input.score,
          input.confidence,
          input.trend,
          JSON.stringify(input.evidence),
          input.status,
        ]
      );
      return toDimension(firstRow(rows));
    },
    async listDimensions(orgId, businessHealthId) {
      const rows = await query<DimensionRow>(
        `SELECT * FROM business_health_dimensions WHERE org_id = $1 AND business_health_id = $2 AND deleted_at IS NULL ORDER BY created_at`,
        [orgId, businessHealthId]
      );
      return rows.map(toDimension);
    },
  };
}
