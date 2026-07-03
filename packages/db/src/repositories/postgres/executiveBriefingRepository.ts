import type { ExecutiveBriefingRecord, BriefingPeriod } from "@boss/types";
import { query } from "../../client.js";
import type { ExecutiveBriefingRepository } from "../types.js";

interface BriefingRow {
  id: string;
  org_id: string;
  business_id: string;
  period: string;
  headline: string;
  summary: string;
  top_priorities: string[];
  key_metrics: Array<{ label: string; value: string; trend: string }>;
  alerts: Array<{ severity: string; message: string }>;
  recommendations: string[];
  period_start: string;
  period_end: string;
  generated_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toBriefing(row: BriefingRow): ExecutiveBriefingRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    period: row.period as BriefingPeriod,
    headline: row.headline,
    summary: row.summary,
    topPriorities: row.top_priorities ?? [],
    keyMetrics: row.key_metrics ?? [],
    alerts: (row.alerts ?? []) as ExecutiveBriefingRecord["alerts"],
    recommendations: row.recommendations ?? [],
    periodStart: row.period_start,
    periodEnd: row.period_end,
    generatedAt: row.generated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresExecutiveBriefingRepository(): ExecutiveBriefingRepository {
  return {
    async create(input) {
      const rows = await query<BriefingRow>(
        `INSERT INTO executive_briefings
           (org_id, business_id, period, headline, summary,
            top_priorities, key_metrics, alerts, recommendations,
            period_start, period_end, generated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING *`,
        [
          input.orgId, input.businessId, input.period,
          input.headline, input.summary,
          JSON.stringify(input.topPriorities),
          JSON.stringify(input.keyMetrics),
          JSON.stringify(input.alerts),
          JSON.stringify(input.recommendations),
          input.periodStart, input.periodEnd, input.generatedAt,
        ]
      );
      return toBriefing(rows[0]!);
    },

    async findById(orgId, id) {
      const rows = await query<BriefingRow>(
        `SELECT * FROM executive_briefings WHERE org_id=$1 AND id=$2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      return rows[0] ? toBriefing(rows[0]) : null;
    },

    async findLatest(orgId, businessId, period) {
      const rows = await query<BriefingRow>(
        period
          ? `SELECT * FROM executive_briefings WHERE org_id=$1 AND business_id=$2 AND period=$3 AND deleted_at IS NULL ORDER BY generated_at DESC LIMIT 1`
          : `SELECT * FROM executive_briefings WHERE org_id=$1 AND business_id=$2 AND deleted_at IS NULL ORDER BY generated_at DESC LIMIT 1`,
        period ? [orgId, businessId, period] : [orgId, businessId]
      );
      return rows[0] ? toBriefing(rows[0]) : null;
    },

    async listByBusinessId(orgId, businessId, limit = 30) {
      const rows = await query<BriefingRow>(
        `SELECT * FROM executive_briefings WHERE org_id=$1 AND business_id=$2 AND deleted_at IS NULL ORDER BY generated_at DESC LIMIT $3`,
        [orgId, businessId, limit]
      );
      return rows.map(toBriefing);
    },
  };
}
