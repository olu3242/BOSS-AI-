import type { PoolClient } from "pg";
import type {
  BusinessEdge,
  BusinessGraphHistoryEntry,
  BusinessGraphStatus,
  BusinessNode,
  GraphMetadata,
  GraphSnapshot,
} from "@boss/types";
import { query, withTransaction } from "../../client.js";
import {
  BusinessGraphConcurrencyError,
  type BusinessGraphMutationContext,
  type BusinessGraphRepository,
} from "../types.js";

interface SnapshotRow {
  graph_id: string;
  org_id: string;
  business_id: string;
  version: number;
  lock_version: number;
  status: BusinessGraphStatus;
  source_discovery_version: number;
  nodes: BusinessNode[];
  edges: BusinessEdge[];
  metadata: GraphMetadata;
  created_by: string;
  created_at: string;
}

interface HistoryRow {
  id: string;
  org_id: string;
  graph_id: string;
  graph_version: number;
  action: BusinessGraphHistoryEntry["action"];
  actor_id: string;
  reason: string;
  correlation_id: string;
  trace_id: string;
  occurred_at: string;
}

function toSnapshot(row: SnapshotRow): GraphSnapshot {
  return Object.freeze({
    graphId: row.graph_id,
    orgId: row.org_id,
    businessId: row.business_id,
    version: row.version,
    lockVersion: row.lock_version,
    status: row.status,
    sourceDiscoveryVersion: row.source_discovery_version,
    nodes: Object.freeze(row.nodes.map((node) => Object.freeze(node))),
    edges: Object.freeze(row.edges.map((edge) => Object.freeze(edge))),
    metadata: Object.freeze(row.metadata),
    createdBy: row.created_by,
    createdAt: row.created_at,
  });
}

function toHistory(row: HistoryRow): BusinessGraphHistoryEntry {
  return Object.freeze({
    id: row.id,
    orgId: row.org_id,
    graphId: row.graph_id,
    graphVersion: row.graph_version,
    action: row.action,
    actorId: row.actor_id,
    reason: row.reason,
    correlationId: row.correlation_id,
    traceId: row.trace_id,
    occurredAt: row.occurred_at,
  });
}

function materialize(
  graphId: string,
  nodes: readonly Omit<BusinessNode, "graphId">[],
  edges: readonly Omit<BusinessEdge, "graphId">[],
): { readonly nodes: readonly BusinessNode[]; readonly edges: readonly BusinessEdge[] } {
  return {
    nodes: nodes.map((node) => ({ ...node, graphId })),
    edges: edges.map((edge) => ({ ...edge, graphId })),
  };
}

async function replaceCurrentContent(
  client: PoolClient,
  graphId: string,
  orgId: string,
  nodes: readonly BusinessNode[],
  edges: readonly BusinessEdge[],
): Promise<void> {
  await client.query("DELETE FROM business_graph_edges WHERE graph_id = $1 AND org_id = $2", [
    graphId,
    orgId,
  ]);
  await client.query("DELETE FROM business_graph_nodes WHERE graph_id = $1 AND org_id = $2", [
    graphId,
    orgId,
  ]);
  for (const node of nodes) {
    await client.query(
      `INSERT INTO business_graph_nodes (
         graph_id, org_id, node_id, node_type, label, external_ref, metadata
       ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [
        graphId,
        orgId,
        node.id,
        node.type,
        node.label,
        node.externalRef ?? null,
        JSON.stringify(node.metadata),
      ],
    );
  }
  for (const edge of edges) {
    await client.query(
      `INSERT INTO business_graph_edges (
         graph_id, org_id, edge_id, source_node_id, target_node_id,
         relationship_type, metadata
       ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [
        graphId,
        orgId,
        edge.id,
        edge.sourceNodeId,
        edge.targetNodeId,
        edge.relationship,
        JSON.stringify(edge.metadata),
      ],
    );
  }
}

async function insertSnapshot(
  client: PoolClient,
  input: {
    readonly graphId: string;
    readonly orgId: string;
    readonly version: number;
    readonly lockVersion: number;
    readonly status: BusinessGraphStatus;
    readonly sourceDiscoveryVersion: number;
    readonly nodes: readonly BusinessNode[];
    readonly edges: readonly BusinessEdge[];
    readonly metadata: GraphMetadata;
    readonly actorId: string;
  },
): Promise<{ readonly created_by: string; readonly created_at: string }> {
  const result = await client.query<{
    created_by: string;
    created_at: string;
  }>(
    `INSERT INTO business_graph_snapshots (
       graph_id, org_id, version, lock_version, status, source_discovery_version,
       nodes, edges, metadata, created_by
     ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10)
     RETURNING created_by, created_at`,
    [
      input.graphId,
      input.orgId,
      input.version,
      input.lockVersion,
      input.status,
      input.sourceDiscoveryVersion,
      JSON.stringify(input.nodes),
      JSON.stringify(input.edges),
      JSON.stringify(input.metadata),
      input.actorId,
    ],
  );
  return result.rows[0]!;
}

async function appendHistory(
  client: PoolClient,
  graphId: string,
  orgId: string,
  version: number,
  action: BusinessGraphHistoryEntry["action"],
  mutation: BusinessGraphMutationContext,
): Promise<void> {
  await client.query(
    `INSERT INTO business_graph_history (
       graph_id, org_id, graph_version, action, actor_id, reason,
       correlation_id, trace_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      graphId,
      orgId,
      version,
      action,
      mutation.actorId,
      mutation.reason,
      mutation.correlationId,
      mutation.traceId,
    ],
  );
}

const snapshotQuery = `
  SELECT graph.id AS graph_id, graph.org_id, graph.business_id,
         snapshot.version, snapshot.lock_version, snapshot.status,
         snapshot.source_discovery_version, snapshot.nodes, snapshot.edges,
         snapshot.metadata, snapshot.created_by, snapshot.created_at
  FROM business_graphs graph
  JOIN business_graph_snapshots snapshot
    ON snapshot.graph_id = graph.id AND snapshot.org_id = graph.org_id`;

export function createPostgresBusinessGraphRepository(): BusinessGraphRepository {
  return {
    async create(input) {
      return withTransaction(async (client) => {
        const graphResult = await client.query<{
          id: string;
          status: BusinessGraphStatus;
          current_version: number;
          lock_version: number;
        }>(
          `INSERT INTO business_graphs (
             org_id, business_id, discovery_id, status, current_version,
             lock_version, source_discovery_version, metadata, created_by
           ) VALUES ($1, $2, $3, 'draft', 1, 1, $4, $5::jsonb, $6)
           RETURNING id, status, current_version, lock_version`,
          [
            input.orgId,
            input.businessId,
            input.discoveryId,
            input.sourceDiscoveryVersion,
            JSON.stringify(input.metadata),
            input.mutation.actorId,
          ],
        );
        const graph = graphResult.rows[0]!;
        const content = materialize(graph.id, input.nodes, input.edges);
        await replaceCurrentContent(
          client,
          graph.id,
          input.orgId,
          content.nodes,
          content.edges,
        );
        const version = await insertSnapshot(client, {
          graphId: graph.id,
          orgId: input.orgId,
          version: 1,
          lockVersion: 1,
          status: "draft",
          sourceDiscoveryVersion: input.sourceDiscoveryVersion,
          nodes: content.nodes,
          edges: content.edges,
          metadata: input.metadata,
          actorId: input.mutation.actorId,
        });
        await appendHistory(
          client,
          graph.id,
          input.orgId,
          1,
          "created",
          input.mutation,
        );
        return toSnapshot({
          graph_id: graph.id,
          org_id: input.orgId,
          business_id: input.businessId,
          version: 1,
          lock_version: 1,
          status: "draft",
          source_discovery_version: input.sourceDiscoveryVersion,
          nodes: [...content.nodes],
          edges: [...content.edges],
          metadata: input.metadata,
          ...version,
        });
      });
    },

    async getCurrent(orgId, businessId) {
      const rows = await query<SnapshotRow>(
        `${snapshotQuery}
         WHERE graph.org_id = $1 AND graph.business_id = $2
           AND snapshot.version = graph.current_version`,
        [orgId, businessId],
      );
      return rows[0] ? toSnapshot(rows[0]) : null;
    },

    async saveSnapshot(input) {
      return withTransaction(async (client) => {
        const result = await client.query<{
          id: string;
          status: BusinessGraphStatus;
          current_version: number;
          lock_version: number;
        }>(
          `UPDATE business_graphs
           SET current_version = current_version + 1,
               lock_version = lock_version + 1,
               source_discovery_version = $4,
               metadata = $5::jsonb,
               updated_at = now()
           WHERE org_id = $1 AND business_id = $2 AND lock_version = $3
             AND status <> 'archived'
           RETURNING id, status, current_version, lock_version`,
          [
            input.orgId,
            input.businessId,
            input.expectedLockVersion,
            input.sourceDiscoveryVersion,
            JSON.stringify(input.metadata),
          ],
        );
        const graph = result.rows[0];
        if (!graph) {
          throw new BusinessGraphConcurrencyError();
        }
        const content = materialize(graph.id, input.nodes, input.edges);
        await replaceCurrentContent(
          client,
          graph.id,
          input.orgId,
          content.nodes,
          content.edges,
        );
        const version = await insertSnapshot(client, {
          graphId: graph.id,
          orgId: input.orgId,
          version: graph.current_version,
          lockVersion: graph.lock_version,
          status: graph.status,
          sourceDiscoveryVersion: input.sourceDiscoveryVersion,
          nodes: content.nodes,
          edges: content.edges,
          metadata: input.metadata,
          actorId: input.mutation.actorId,
        });
        await appendHistory(
          client,
          graph.id,
          input.orgId,
          graph.current_version,
          input.action,
          input.mutation,
        );
        return toSnapshot({
          graph_id: graph.id,
          org_id: input.orgId,
          business_id: input.businessId,
          version: graph.current_version,
          lock_version: graph.lock_version,
          status: graph.status,
          source_discovery_version: input.sourceDiscoveryVersion,
          nodes: [...content.nodes],
          edges: [...content.edges],
          metadata: input.metadata,
          ...version,
        });
      });
    },

    async transition(input) {
      return withTransaction(async (client) => {
        const current = await client.query<SnapshotRow>(
          `${snapshotQuery}
           WHERE graph.org_id = $1 AND graph.business_id = $2
             AND graph.lock_version = $3
             AND snapshot.version = graph.current_version
           FOR UPDATE OF graph`,
          [input.orgId, input.businessId, input.expectedLockVersion],
        );
        const before = current.rows[0];
        if (!before) {
          throw new BusinessGraphConcurrencyError();
        }
        const updated = await client.query<{
          current_version: number;
          lock_version: number;
        }>(
          `UPDATE business_graphs
           SET status = $4, current_version = current_version + 1,
               lock_version = lock_version + 1, updated_at = now()
           WHERE org_id = $1 AND business_id = $2 AND lock_version = $3
           RETURNING current_version, lock_version`,
          [
            input.orgId,
            input.businessId,
            input.expectedLockVersion,
            input.status,
          ],
        );
        const graph = updated.rows[0]!;
        const version = await insertSnapshot(client, {
          graphId: before.graph_id,
          orgId: input.orgId,
          version: graph.current_version,
          lockVersion: graph.lock_version,
          status: input.status,
          sourceDiscoveryVersion: before.source_discovery_version,
          nodes: before.nodes,
          edges: before.edges,
          metadata: before.metadata,
          actorId: input.mutation.actorId,
        });
        await appendHistory(
          client,
          before.graph_id,
          input.orgId,
          graph.current_version,
          input.status === "published" ? "published" : "archived",
          input.mutation,
        );
        return toSnapshot({
          ...before,
          version: graph.current_version,
          lock_version: graph.lock_version,
          status: input.status,
          ...version,
        });
      });
    },

    async getVersion(orgId, businessId, version) {
      const rows = await query<SnapshotRow>(
        `${snapshotQuery}
         WHERE graph.org_id = $1 AND graph.business_id = $2
           AND snapshot.version = $3`,
        [orgId, businessId, version],
      );
      return rows[0] ? toSnapshot(rows[0]) : null;
    },

    async listVersions(orgId, businessId) {
      const rows = await query<SnapshotRow>(
        `${snapshotQuery}
         WHERE graph.org_id = $1 AND graph.business_id = $2
         ORDER BY snapshot.version`,
        [orgId, businessId],
      );
      return Object.freeze(rows.map(toSnapshot));
    },

    async listHistory(orgId, businessId) {
      const rows = await query<HistoryRow>(
        `SELECT history.*
         FROM business_graph_history history
         JOIN business_graphs graph ON graph.id = history.graph_id
         WHERE history.org_id = $1 AND graph.business_id = $2
         ORDER BY history.occurred_at, history.id`,
        [orgId, businessId],
      );
      return Object.freeze(rows.map(toHistory));
    },
  };
}
