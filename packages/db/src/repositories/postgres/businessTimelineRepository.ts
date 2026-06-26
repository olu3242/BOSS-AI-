import type { BusinessTimelineEntry } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { BusinessTimelineRepository } from "../types.js";

interface TimelineRow {
  id: string;
  org_id: string;
  business_id: string;
  type: BusinessTimelineEntry["type"];
  description: string;
  metadata: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toEntry(row: TimelineRow): BusinessTimelineEntry {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    type: row.type,
    description: row.description,
    metadata: row.metadata,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresBusinessTimelineRepository(): BusinessTimelineRepository {
  return {
    async append(input) {
      const rows = await query<TimelineRow>(
        `INSERT INTO business_timeline (org_id, business_id, type, description, metadata, occurred_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [input.orgId, input.businessId, input.type, input.description, JSON.stringify(input.metadata), input.occurredAt]
      );
      return toEntry(firstRow(rows));
    },
    async listByBusinessId(orgId, businessId) {
      const rows = await query<TimelineRow>(
        `SELECT * FROM business_timeline WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL ORDER BY occurred_at`,
        [orgId, businessId]
      );
      return rows.map(toEntry);
    },
  };
}
