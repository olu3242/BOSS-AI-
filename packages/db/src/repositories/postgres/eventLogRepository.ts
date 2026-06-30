import { query } from "../../client.js";
import type { EventLogEntry, EventLogRepository } from "../types.js";

interface EventLogRow {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  occurred_at: string;
  org_id: string | null;
  correlation_id: string | null;
  causation_id: string | null;
  created_at: string;
}

function toEntry(row: EventLogRow): EventLogEntry {
  return {
    id: row.id,
    type: row.type,
    payload: row.payload,
    occurredAt: row.occurred_at,
    orgId: row.org_id,
    correlationId: row.correlation_id,
    causationId: row.causation_id,
    createdAt: row.created_at,
  };
}

export function createPostgresEventLogRepository(): EventLogRepository {
  return {
    async append(input) {
      const rows = await query<EventLogRow>(
        `INSERT INTO event_log (type, payload, occurred_at, org_id, correlation_id, causation_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [input.type, JSON.stringify(input.payload), input.occurredAt, input.orgId ?? null, input.correlationId ?? null, input.causationId ?? null]
      );
      return toEntry(rows[0]!);
    },

    async listByType(type, limit = 100) {
      const rows = await query<EventLogRow>(
        `SELECT * FROM event_log WHERE type = $1 ORDER BY occurred_at DESC LIMIT $2`,
        [type, limit]
      );
      return rows.map(toEntry);
    },

    async listByOrgId(orgId, limit = 200) {
      const rows = await query<EventLogRow>(
        `SELECT * FROM event_log WHERE org_id = $1 ORDER BY occurred_at DESC LIMIT $2`,
        [orgId, limit]
      );
      return rows.map(toEntry);
    },

    async listByCorrelationId(correlationId) {
      const rows = await query<EventLogRow>(
        `SELECT * FROM event_log WHERE correlation_id = $1 ORDER BY occurred_at ASC`,
        [correlationId]
      );
      return rows.map(toEntry);
    },

    async listSince(since, limit = 500) {
      const rows = await query<EventLogRow>(
        `SELECT * FROM event_log WHERE occurred_at >= $1 ORDER BY occurred_at ASC LIMIT $2`,
        [since, limit]
      );
      return rows.map(toEntry);
    },
  };
}
