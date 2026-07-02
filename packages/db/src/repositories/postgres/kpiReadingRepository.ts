import type { KpiReadingRecord } from "@boss/types";
import { query } from "../../client.js";
import type { KpiReadingRepository } from "../types.js";

interface KpiReadingRow {
  id: string;
  org_id: string;
  business_id: string;
  kpi_key: string;
  label: string;
  value: string | null;
  unit: string;
  trend: string;
  source: string;
  measured_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toRecord(row: KpiReadingRow): KpiReadingRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    kpiKey: row.kpi_key,
    label: row.label,
    value: row.value !== null ? parseFloat(row.value) : null,
    unit: row.unit,
    trend: row.trend as KpiReadingRecord["trend"],
    source: row.source as KpiReadingRecord["source"],
    measuredAt: row.measured_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresKpiReadingRepository(): KpiReadingRepository {
  return {
    async append(input) {
      const rows = await query<KpiReadingRow>(
        `INSERT INTO kpi_readings
           (org_id, business_id, kpi_key, label, value, unit, trend, source, measured_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [
          input.orgId, input.businessId, input.kpiKey, input.label,
          input.value, input.unit, input.trend, input.source, input.measuredAt,
        ]
      );
      return toRecord(rows[0]!);
    },

    async listByBusinessId(orgId, businessId, limit = 200) {
      const rows = await query<KpiReadingRow>(
        `SELECT * FROM kpi_readings
         WHERE org_id=$1 AND business_id=$2 AND deleted_at IS NULL
         ORDER BY measured_at DESC LIMIT $3`,
        [orgId, businessId, limit]
      );
      return rows.map(toRecord);
    },

    async listByKpiKey(orgId, businessId, kpiKey, limit = 90) {
      const rows = await query<KpiReadingRow>(
        `SELECT * FROM kpi_readings
         WHERE org_id=$1 AND business_id=$2 AND kpi_key=$3 AND deleted_at IS NULL
         ORDER BY measured_at DESC LIMIT $4`,
        [orgId, businessId, kpiKey, limit]
      );
      return rows.map(toRecord);
    },

    async latestByKpiKey(orgId, businessId, kpiKey) {
      const rows = await query<KpiReadingRow>(
        `SELECT * FROM kpi_readings
         WHERE org_id=$1 AND business_id=$2 AND kpi_key=$3 AND deleted_at IS NULL
         ORDER BY measured_at DESC LIMIT 1`,
        [orgId, businessId, kpiKey]
      );
      return rows[0] ? toRecord(rows[0]) : null;
    },
  };
}
