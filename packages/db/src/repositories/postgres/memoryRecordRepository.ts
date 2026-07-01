import type { MemoryRecord } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { MemoryRecordRepository } from "../types.js";

interface MemoryRecordRow {
  id: string;
  org_id: string;
  business_id: string;
  owner_type: MemoryRecord["ownerType"];
  owner_id: string;
  key: string;
  value: unknown;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

function toMemoryRecord(row: MemoryRecordRow): MemoryRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    ownerType: row.owner_type,
    ownerId: row.owner_id,
    key: row.key,
    value: row.value,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createPostgresMemoryRecordRepository(): MemoryRecordRepository {
  return {
    async upsert(input) {
      const rows = await query<MemoryRecordRow>(
        `INSERT INTO memory_records (org_id, business_id, owner_type, owner_id, key, value, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (org_id, business_id, owner_type, owner_id, key)
         DO UPDATE SET value = $6, expires_at = $7, updated_at = now()
         RETURNING *`,
        [
          input.orgId,
          input.businessId,
          input.ownerType,
          input.ownerId,
          input.key,
          JSON.stringify(input.value),
          input.expiresAt,
        ]
      );
      return toMemoryRecord(firstRow(rows));
    },
    async get(orgId, businessId, ownerType, ownerId, key) {
      const rows = await query<MemoryRecordRow>(
        `SELECT * FROM memory_records WHERE org_id = $1 AND business_id = $2 AND owner_type = $3 AND owner_id = $4 AND key = $5`,
        [orgId, businessId, ownerType, ownerId, key]
      );
      return rows[0] ? toMemoryRecord(rows[0]) : null;
    },
    async listByOwner(orgId, businessId, ownerType, ownerId) {
      const rows = await query<MemoryRecordRow>(
        `SELECT * FROM memory_records WHERE org_id = $1 AND business_id = $2 AND owner_type = $3 AND owner_id = $4 ORDER BY updated_at DESC`,
        [orgId, businessId, ownerType, ownerId]
      );
      return rows.map(toMemoryRecord);
    },
  };
}
