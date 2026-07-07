import type { Workflow, WorkflowStatus } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { WorkflowRepository } from "../types.js";

interface WorkflowRow {
  id: string;
  org_id: string;
  business_id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  status: string;
  version: number;
  configuration: Record<string, unknown>;
  owner_id: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toWorkflow(row: WorkflowRow): Workflow {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    name: row.name,
    description: row.description,
    triggerEvent: row.trigger_event,
    status: row.status as WorkflowStatus,
    version: row.version,
    configuration: row.configuration ?? {},
    ownerId: row.owner_id,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
  };
}

export function createPostgresWorkflowRepository(): WorkflowRepository {
  return {
    async create(input) {
      const rows = await query<WorkflowRow>(
        `INSERT INTO workflows (org_id, business_id, name, description, trigger_event, status, version, configuration, owner_id, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [input.orgId, input.businessId, input.name, input.description ?? null, input.triggerEvent,
         input.status ?? 'draft', input.version ?? 1, JSON.stringify(input.configuration ?? {}),
         input.ownerId ?? null, input.tags ?? []]
      );
      return toWorkflow(firstRow(rows)!);
    },

    async findById(orgId, id) {
      const rows = await query<WorkflowRow>(
        `SELECT * FROM workflows WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      const row = firstRow(rows);
      return row ? toWorkflow(row) : null;
    },

    async update(orgId, id, patch) {
      const rows = await query<WorkflowRow>(
        `UPDATE workflows SET
          name = COALESCE($3, name),
          description = COALESCE($4, description),
          trigger_event = COALESCE($5, trigger_event),
          status = COALESCE($6, status),
          version = COALESCE($7, version),
          configuration = COALESCE($8, configuration),
          owner_id = COALESCE($9, owner_id),
          tags = COALESCE($10, tags),
          updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [orgId, id, patch.name ?? null, patch.description ?? null, patch.triggerEvent ?? null,
         patch.status ?? null, patch.version ?? null,
         patch.configuration ? JSON.stringify(patch.configuration) : null,
         patch.ownerId ?? null, patch.tags ?? null]
      );
      return toWorkflow(firstRow(rows)!);
    },

    async delete(orgId, id) {
      await query(
        `UPDATE workflows SET deleted_at = now(), updated_at = now() WHERE org_id = $1 AND id = $2`,
        [orgId, id]
      );
    },

    async listByBusinessId(orgId, businessId) {
      const rows = await query<WorkflowRow>(
        `SELECT * FROM workflows WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC`,
        [orgId, businessId]
      );
      return rows.map(toWorkflow);
    },

    async listByTriggerEvent(orgId, triggerEvent) {
      const rows = await query<WorkflowRow>(
        `SELECT * FROM workflows WHERE org_id = $1 AND trigger_event = $2 AND status = 'published' AND deleted_at IS NULL ORDER BY version DESC`,
        [orgId, triggerEvent]
      );
      return rows.map(toWorkflow);
    },
  };
}
