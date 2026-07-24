import { randomUUID } from "node:crypto";
import type { WorkflowSession, WorkflowSessionStatus } from "@boss/types";
import { query, firstRow } from "@boss/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UpsertWorkflowSessionInput {
  orgId: string;
  userId: string;
  workflowType: string;
  currentStep: number;
  completedSteps: number[];
  totalSteps: number;
  formData: Record<string, unknown>;
  validationState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  version?: number;
  expiresAt?: string | null;
}

export interface WorkflowSessionService {
  getActive(orgId: string, workflowType: string): Promise<WorkflowSession | null>;
  upsert(input: UpsertWorkflowSessionInput): Promise<WorkflowSession>;
  complete(orgId: string, workflowType: string): Promise<WorkflowSession>;
  cancel(orgId: string, workflowType: string): Promise<WorkflowSession>;
  touch(orgId: string, workflowType: string): Promise<void>;
}

// ─── DB row ───────────────────────────────────────────────────────────────────

interface WorkflowSessionRow extends Record<string, unknown> {
  id: string;
  org_id: string;
  user_id: string;
  workflow_type: string;
  status: WorkflowSessionStatus;
  current_step: number;
  completed_steps: number[];
  total_steps: number;
  progress_pct: string;
  form_data: Record<string, unknown>;
  validation_state: Record<string, unknown>;
  metadata: Record<string, unknown>;
  correlation_id: string;
  version: number;
  started_at: string;
  last_activity_at: string;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function toSession(row: WorkflowSessionRow): WorkflowSession {
  return {
    id: row.id,
    orgId: row.org_id,
    userId: row.user_id,
    workflowType: row.workflow_type,
    status: row.status,
    currentStep: row.current_step,
    completedSteps: row.completed_steps ?? [],
    totalSteps: row.total_steps,
    progressPct: parseFloat(row.progress_pct as unknown as string),
    formData: row.form_data ?? {},
    validationState: row.validation_state ?? {},
    metadata: row.metadata ?? {},
    correlationId: row.correlation_id,
    version: row.version,
    startedAt: row.started_at,
    lastActivityAt: row.last_activity_at,
    expiresAt: row.expires_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

// ─── Service factory ──────────────────────────────────────────────────────────

export function createWorkflowSessionService(): WorkflowSessionService {
  return {
    async getActive(orgId, workflowType) {
      const rows = await query<WorkflowSessionRow>(
        `SELECT * FROM workflow_sessions
         WHERE org_id = $1 AND workflow_type = $2
           AND status = 'in_progress' AND deleted_at IS NULL
         ORDER BY last_activity_at DESC LIMIT 1`,
        [orgId, workflowType],
      );
      return rows[0] ? toSession(rows[0]) : null;
    },

    async upsert(input) {
      const pct =
        input.totalSteps > 0
          ? Math.round(((input.completedSteps.length) / input.totalSteps) * 100)
          : 0;

      const rows = await query<WorkflowSessionRow>(
        `INSERT INTO workflow_sessions
           (org_id, user_id, workflow_type, current_step, completed_steps, total_steps,
            progress_pct, form_data, validation_state, metadata, correlation_id, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (org_id, workflow_type) WHERE status = 'in_progress' AND deleted_at IS NULL
         DO UPDATE SET
           current_step      = EXCLUDED.current_step,
           completed_steps   = EXCLUDED.completed_steps,
           total_steps       = EXCLUDED.total_steps,
           progress_pct      = EXCLUDED.progress_pct,
           form_data         = EXCLUDED.form_data,
           validation_state  = EXCLUDED.validation_state,
           metadata          = EXCLUDED.metadata,
           expires_at        = EXCLUDED.expires_at,
           last_activity_at  = now(),
           version           = workflow_sessions.version + 1,
           updated_at        = now()
         RETURNING *`,
        [
          input.orgId,
          input.userId,
          input.workflowType,
          input.currentStep,
          input.completedSteps,
          input.totalSteps,
          pct,
          JSON.stringify(input.formData),
          JSON.stringify(input.validationState ?? {}),
          JSON.stringify(input.metadata ?? {}),
          randomUUID(),
          input.expiresAt ?? null,
        ],
      );
      return toSession(firstRow(rows));
    },

    async complete(orgId, workflowType) {
      const rows = await query<WorkflowSessionRow>(
        `UPDATE workflow_sessions
         SET status = 'completed', completed_at = now(), last_activity_at = now(),
             updated_at = now(), progress_pct = 100
         WHERE org_id = $1 AND workflow_type = $2 AND status = 'in_progress' AND deleted_at IS NULL
         RETURNING *`,
        [orgId, workflowType],
      );
      return toSession(firstRow(rows));
    },

    async cancel(orgId, workflowType) {
      const rows = await query<WorkflowSessionRow>(
        `UPDATE workflow_sessions
         SET status = 'cancelled', last_activity_at = now(), updated_at = now()
         WHERE org_id = $1 AND workflow_type = $2 AND status = 'in_progress' AND deleted_at IS NULL
         RETURNING *`,
        [orgId, workflowType],
      );
      return toSession(firstRow(rows));
    },

    async touch(orgId, workflowType) {
      await query(
        `UPDATE workflow_sessions
         SET last_activity_at = now(), updated_at = now()
         WHERE org_id = $1 AND workflow_type = $2 AND status = 'in_progress' AND deleted_at IS NULL`,
        [orgId, workflowType],
      );
    },
  };
}
