import type { BusinessGoal, GoalMilestone, GoalStatus } from "@boss/types";
import { query } from "../../client.js";
import type { BusinessGoalRepository } from "../types.js";

interface GoalRow {
  id: string;
  org_id: string;
  business_id: string;
  category: string;
  title: string;
  description: string;
  kpi_key: string | null;
  target_value: string | null;
  current_value: string | null;
  unit: string | null;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  milestones: GoalMilestone[];
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toGoal(row: GoalRow): BusinessGoal {
  return {
    id: row.id,
    orgId: row.org_id,
    businessId: row.business_id,
    category: row.category as BusinessGoal["category"],
    title: row.title,
    description: row.description,
    kpiKey: row.kpi_key,
    targetValue: row.target_value !== null ? parseFloat(row.target_value) : null,
    currentValue: row.current_value !== null ? parseFloat(row.current_value) : null,
    unit: row.unit,
    dueDate: row.due_date,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    milestones: row.milestones ?? [],
    status: row.status as GoalStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function createPostgresBusinessGoalRepository(): BusinessGoalRepository {
  return {
    async create(input) {
      const rows = await query<GoalRow>(
        `INSERT INTO business_goals
           (org_id, business_id, category, title, description, kpi_key,
            target_value, current_value, unit, due_date, started_at, milestones, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING *`,
        [
          input.orgId, input.businessId, input.category, input.title,
          input.description, input.kpiKey ?? null,
          input.targetValue ?? null, input.currentValue ?? null,
          input.unit ?? null, input.dueDate ?? null, input.startedAt ?? null,
          JSON.stringify(input.milestones ?? []), input.status,
        ]
      );
      return toGoal(rows[0]!);
    },

    async findById(orgId, id) {
      const rows = await query<GoalRow>(
        `SELECT * FROM business_goals WHERE org_id=$1 AND id=$2 AND deleted_at IS NULL`,
        [orgId, id]
      );
      return rows[0] ? toGoal(rows[0]) : null;
    },

    async update(orgId, id, patch) {
      const rows = await query<GoalRow>(
        `UPDATE business_goals SET
           title         = COALESCE($3, title),
           description   = COALESCE($4, description),
           target_value  = COALESCE($5, target_value),
           current_value = COALESCE($6, current_value),
           due_date      = COALESCE($7, due_date),
           started_at    = COALESCE($8, started_at),
           completed_at  = COALESCE($9, completed_at),
           milestones    = COALESCE($10, milestones),
           status        = COALESCE($11, status),
           updated_at    = now()
         WHERE org_id=$1 AND id=$2 AND deleted_at IS NULL
         RETURNING *`,
        [
          orgId, id,
          patch.title ?? null, patch.description ?? null,
          patch.targetValue ?? null, patch.currentValue ?? null,
          patch.dueDate ?? null, patch.startedAt ?? null, patch.completedAt ?? null,
          patch.milestones ? JSON.stringify(patch.milestones) : null,
          patch.status ?? null,
        ]
      );
      return toGoal(rows[0]!);
    },

    async updateStatus(orgId, id, status) {
      const rows = await query<GoalRow>(
        `UPDATE business_goals SET status=$3, updated_at=now()
         WHERE org_id=$1 AND id=$2 AND deleted_at IS NULL RETURNING *`,
        [orgId, id, status]
      );
      return toGoal(rows[0]!);
    },

    async listByBusinessId(orgId, businessId) {
      const rows = await query<GoalRow>(
        `SELECT * FROM business_goals WHERE org_id=$1 AND business_id=$2 AND deleted_at IS NULL ORDER BY created_at DESC`,
        [orgId, businessId]
      );
      return rows.map(toGoal);
    },

    async listByStatus(orgId, businessId, status) {
      const rows = await query<GoalRow>(
        `SELECT * FROM business_goals WHERE org_id=$1 AND business_id=$2 AND status=$3 AND deleted_at IS NULL ORDER BY created_at DESC`,
        [orgId, businessId, status]
      );
      return rows.map(toGoal);
    },
  };
}
