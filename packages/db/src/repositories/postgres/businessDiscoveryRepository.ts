import type {
  BusinessContextSnapshot,
  BusinessDiscoveryHistoryEntry,
  BusinessDiscoveryStatus,
  CanonicalBusinessContextData,
} from "@boss/types";
import { query, withTransaction } from "../../client.js";
import {
  BusinessDiscoveryConcurrencyError,
  type BusinessDiscoveryRepository,
} from "../types.js";

interface DiscoverySnapshotRow {
  id: string;
  org_id: string;
  business_id: string;
  status: BusinessDiscoveryStatus;
  current_version: number;
  lock_version: number;
  schema_version: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  context: CanonicalBusinessContextData;
  version_created_by: string;
  version_created_at: string;
}

interface HistoryRow {
  id: string;
  org_id: string;
  discovery_id: string;
  discovery_version: number;
  action: BusinessDiscoveryHistoryEntry["action"];
  previous_status: BusinessDiscoveryStatus | null;
  new_status: BusinessDiscoveryStatus;
  actor_id: string;
  reason: string;
  correlation_id: string;
  trace_id: string;
  occurred_at: string;
}

const snapshotSelect = `
  SELECT discovery.id, discovery.org_id, discovery.business_id,
         discovery.status, discovery.current_version, discovery.lock_version,
         discovery.schema_version, discovery.created_by, discovery.created_at,
         discovery.updated_at, version.context,
         version.created_by AS version_created_by,
         version.created_at AS version_created_at
  FROM business_discoveries discovery
  JOIN business_context_versions version
    ON version.discovery_id = discovery.id
   AND version.version = discovery.current_version
   AND version.org_id = discovery.org_id`;

function toSnapshot(row: DiscoverySnapshotRow): BusinessContextSnapshot {
  return Object.freeze({
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    status: row.status,
    discoveryVersion: row.current_version,
    lockVersion: row.lock_version,
    schemaVersion: row.schema_version,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    context: Object.freeze(row.context),
    versionCreatedBy: row.version_created_by,
    versionCreatedAt: row.version_created_at,
  });
}

function toHistory(row: HistoryRow): BusinessDiscoveryHistoryEntry {
  return Object.freeze({
    id: row.id,
    orgId: row.org_id,
    discoveryId: row.discovery_id,
    discoveryVersion: row.discovery_version,
    action: row.action,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    actorId: row.actor_id,
    reason: row.reason,
    correlationId: row.correlation_id,
    traceId: row.trace_id,
    occurredAt: row.occurred_at,
  });
}

export function createPostgresBusinessDiscoveryRepository(): BusinessDiscoveryRepository {
  return {
    async create(input) {
      return withTransaction(async (client) => {
        const discoveryResult = await client.query<DiscoverySnapshotRow>(
          `INSERT INTO business_discoveries (
             org_id, business_id, status, current_version, lock_version,
             schema_version, created_by
           ) VALUES ($1, $2, 'draft', 1, 1, $3, $4)
           RETURNING id, org_id, business_id, status, current_version,
                     lock_version, schema_version, created_by, created_at,
                     updated_at`,
          [
            input.orgId,
            input.businessId,
            input.schemaVersion,
            input.mutation.actorId,
          ],
        );
        const discovery = discoveryResult.rows[0]!;
        const versionResult = await client.query<{
          context: CanonicalBusinessContextData;
          version_created_by: string;
          version_created_at: string;
        }>(
          `INSERT INTO business_context_versions (
             org_id, discovery_id, version, schema_version,
             status_at_creation, context, created_by
           ) VALUES ($1, $2, 1, $3, 'draft', $4::jsonb, $5)
           RETURNING context, created_by AS version_created_by,
                     created_at AS version_created_at`,
          [
            input.orgId,
            discovery.id,
            input.schemaVersion,
            JSON.stringify(input.context),
            input.mutation.actorId,
          ],
        );
        await client.query(
          `INSERT INTO business_discovery_history (
             org_id, discovery_id, discovery_version, action,
             previous_status, new_status, actor_id, reason,
             correlation_id, trace_id
           ) VALUES ($1, $2, 1, 'created', NULL, 'draft', $3, $4, $5, $6)`,
          [
            input.orgId,
            discovery.id,
            input.mutation.actorId,
            input.mutation.reason,
            input.mutation.correlationId,
            input.mutation.traceId,
          ],
        );
        return toSnapshot({
          ...discovery,
          ...versionResult.rows[0]!,
        });
      });
    },

    async getCurrent(orgId, businessId) {
      const rows = await query<DiscoverySnapshotRow>(
        `${snapshotSelect}
         WHERE discovery.org_id = $1 AND discovery.business_id = $2`,
        [orgId, businessId],
      );
      return rows[0] ? toSnapshot(rows[0]) : null;
    },

    async saveContext(input) {
      return withTransaction(async (client) => {
        const result = await client.query<DiscoverySnapshotRow>(
          `UPDATE business_discoveries
           SET current_version = current_version + 1,
               lock_version = lock_version + 1,
               updated_at = now()
           WHERE org_id = $1 AND business_id = $2
             AND lock_version = $3
             AND status IN ('draft', 'in_progress')
           RETURNING id, org_id, business_id, status, current_version,
                     lock_version, schema_version, created_by, created_at,
                     updated_at`,
          [input.orgId, input.businessId, input.expectedLockVersion],
        );
        const discovery = result.rows[0];
        if (!discovery) {
          throw new BusinessDiscoveryConcurrencyError();
        }
        const versionResult = await client.query<{
          context: CanonicalBusinessContextData;
          version_created_by: string;
          version_created_at: string;
        }>(
          `INSERT INTO business_context_versions (
             org_id, discovery_id, version, schema_version,
             status_at_creation, context, created_by
           ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
           RETURNING context, created_by AS version_created_by,
                     created_at AS version_created_at`,
          [
            input.orgId,
            discovery.id,
            discovery.current_version,
            discovery.schema_version,
            discovery.status,
            JSON.stringify(input.context),
            input.mutation.actorId,
          ],
        );
        await client.query(
          `INSERT INTO business_discovery_history (
             org_id, discovery_id, discovery_version, action,
             previous_status, new_status, actor_id, reason,
             correlation_id, trace_id
           ) VALUES ($1, $2, $3, 'updated', $4, $4, $5, $6, $7, $8)`,
          [
            input.orgId,
            discovery.id,
            discovery.current_version,
            discovery.status,
            input.mutation.actorId,
            input.mutation.reason,
            input.mutation.correlationId,
            input.mutation.traceId,
          ],
        );
        return toSnapshot({
          ...discovery,
          ...versionResult.rows[0]!,
        });
      });
    },

    async transition(input) {
      return withTransaction(async (client) => {
        const current = await client.query<{
          id: string;
          status: BusinessDiscoveryStatus;
          current_version: number;
        }>(
          `SELECT id, status, current_version
           FROM business_discoveries
           WHERE org_id = $1 AND business_id = $2 AND lock_version = $3
           FOR UPDATE`,
          [input.orgId, input.businessId, input.expectedLockVersion],
        );
        const before = current.rows[0];
        if (!before) {
          throw new BusinessDiscoveryConcurrencyError();
        }
        const updated = await client.query<DiscoverySnapshotRow>(
          `UPDATE business_discoveries
           SET status = $4, lock_version = lock_version + 1, updated_at = now()
           WHERE org_id = $1 AND business_id = $2 AND lock_version = $3
           RETURNING id, org_id, business_id, status, current_version,
                     lock_version, schema_version, created_by, created_at,
                     updated_at`,
          [
            input.orgId,
            input.businessId,
            input.expectedLockVersion,
            input.status,
          ],
        );
        const discovery = updated.rows[0];
        if (!discovery) {
          throw new BusinessDiscoveryConcurrencyError();
        }
        await client.query(
          `INSERT INTO business_discovery_history (
             org_id, discovery_id, discovery_version, action,
             previous_status, new_status, actor_id, reason,
             correlation_id, trace_id
           ) VALUES ($1, $2, $3, 'transitioned', $4, $5, $6, $7, $8, $9)`,
          [
            input.orgId,
            discovery.id,
            discovery.current_version,
            before.status,
            input.status,
            input.mutation.actorId,
            input.mutation.reason,
            input.mutation.correlationId,
            input.mutation.traceId,
          ],
        );
        const version = await client.query<{
          context: CanonicalBusinessContextData;
          version_created_by: string;
          version_created_at: string;
        }>(
          `SELECT context, created_by AS version_created_by,
                  created_at AS version_created_at
           FROM business_context_versions
           WHERE org_id = $1 AND discovery_id = $2 AND version = $3`,
          [input.orgId, discovery.id, discovery.current_version],
        );
        return toSnapshot({ ...discovery, ...version.rows[0]! });
      });
    },

    async listVersions(orgId, businessId) {
      const rows = await query<DiscoverySnapshotRow>(
        `SELECT discovery.id, discovery.org_id, discovery.business_id,
                version.status_at_creation AS status,
                version.version AS current_version,
                discovery.lock_version, version.schema_version,
                discovery.created_by, discovery.created_at,
                discovery.updated_at, version.context,
                version.created_by AS version_created_by,
                version.created_at AS version_created_at
         FROM business_discoveries discovery
         JOIN business_context_versions version
           ON version.discovery_id = discovery.id
          AND version.org_id = discovery.org_id
         WHERE discovery.org_id = $1 AND discovery.business_id = $2
         ORDER BY version.version`,
        [orgId, businessId],
      );
      return Object.freeze(rows.map(toSnapshot));
    },

    async listHistory(orgId, businessId) {
      const rows = await query<HistoryRow>(
        `SELECT history.*
         FROM business_discovery_history history
         JOIN business_discoveries discovery ON discovery.id = history.discovery_id
         WHERE history.org_id = $1 AND discovery.business_id = $2
         ORDER BY history.occurred_at, history.id`,
        [orgId, businessId],
      );
      return Object.freeze(rows.map(toHistory));
    },
  };
}
