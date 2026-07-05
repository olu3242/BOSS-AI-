import type { StandaloneTask, StandaloneTaskStatus, StandaloneTaskPriority } from "@boss/types";
import { query, firstRow } from "../../client.js";
import type { TaskRepository } from "../types.js";

interface TaskRow {
  id: string;
  org_id: string;
  business_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  due_at: string | null;
  completed_at: string | null;
  parent_task_id: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toTask(row: TaskRow): StandaloneTask {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    title: row.title,
    description: row.description,
    status: row.status as StandaloneTaskStatus,
    priority: row.priority as StandaloneTaskPriority,
    assignedTo: row.assigned_to,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    parentTaskId: row.parent_task_id,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresTaskRepository(): TaskRepository {
  return {
    async create(input) {
      const rows = await query<TaskRow>(
        `INSERT INTO tasks
           (org_id, business_id, title, description, status, priority,
            assigned_to, due_at, parent_task_id, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING *`,
        [
          input.orgId, input.businessId,
          input.title, input.description ?? null,
          input.status ?? "todo",
          input.priority ?? "normal",
          input.assignedTo ?? null,
          input.dueAt ?? null,
          input.parentTaskId ?? null,
          input.tags ?? [],
        ]
      );
      return toTask(firstRow(rows));
    },

    async findById(orgId, id) {
      const rows = await query<TaskRow>(
        `SELECT * FROM tasks WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      return rows[0] ? toTask(rows[0]) : null;
    },

    async update(orgId, id, patch) {
      const completedAt = patch.status === "done" ? "now()" : null;
      const rows = await query<TaskRow>(
        `UPDATE tasks
         SET title          = COALESCE($3, title),
             description    = COALESCE($4, description),
             status         = COALESCE($5, status),
             priority       = COALESCE($6, priority),
             assigned_to    = COALESCE($7, assigned_to),
             due_at         = COALESCE($8, due_at),
             tags           = COALESCE($9, tags),
             completed_at   = CASE WHEN $10::boolean THEN now() ELSE completed_at END,
             updated_at     = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL
         RETURNING *`,
        [
          orgId, id,
          patch.title ?? null, patch.description ?? null,
          patch.status ?? null, patch.priority ?? null,
          patch.assignedTo ?? null, patch.dueAt ?? null,
          patch.tags ?? null,
          completedAt !== null,
        ]
      );
      return toTask(firstRow(rows));
    },

    async delete(orgId, id) {
      await query(
        `UPDATE tasks SET deleted_at = now(), updated_at = now()
         WHERE org_id = $1 AND id = $2 AND deleted_at IS NULL`,
        [orgId, id]
      );
    },

    async listByBusinessId(orgId, businessId) {
      const rows = await query<TaskRow>(
        `SELECT * FROM tasks
         WHERE org_id = $1 AND business_id = $2 AND deleted_at IS NULL
         ORDER BY
           CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
           due_at ASC NULLS LAST,
           created_at DESC`,
        [orgId, businessId]
      );
      return rows.map(toTask);
    },

    async listChildren(orgId, parentTaskId) {
      const rows = await query<TaskRow>(
        `SELECT * FROM tasks
         WHERE org_id = $1 AND parent_task_id = $2 AND deleted_at IS NULL
         ORDER BY created_at ASC`,
        [orgId, parentTaskId]
      );
      return rows.map(toTask);
    },
  };
}
