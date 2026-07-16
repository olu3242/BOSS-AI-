import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { query, withTransaction } from "../../client.js";

export type PlatformAuditOutcome = "success" | "failure" | "denied";

export interface PlatformAuditInput {
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  outcome: PlatformAuditOutcome;
  traceId: string;
  correlationId: string;
  metadata?: Record<string, unknown>;
}

export interface PlatformAssignment {
  userId: string;
  roleKey: string;
  grantedBy: string;
  grantedAt: string;
  revokedAt: string | null;
  notes: string | null;
}

export type BootstrapDecision =
  | { status: "granted"; assignment: PlatformAssignment }
  | { status: "already_bootstrapped" }
  | { status: "founder_relationship_required" };

interface AssignmentRow {
  user_id: string;
  role_key: string;
  granted_by: string;
  granted_at: string;
  revoked_at: string | null;
  notes: string | null;
}

function assignment(row: AssignmentRow): PlatformAssignment {
  return {
    userId: row.user_id,
    roleKey: row.role_key,
    grantedBy: row.granted_by,
    grantedAt: row.granted_at,
    revokedAt: row.revoked_at,
    notes: row.notes,
  };
}

async function insertAudit(client: PoolClient, input: PlatformAuditInput): Promise<void> {
  await client.query(
    `INSERT INTO platform_audit_events (
       id, actor_id, action, resource_type, resource_id, outcome,
       trace_id, correlation_id, metadata, occurred_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,now())`,
    [
      randomUUID(),
      input.actorId,
      input.action,
      input.resourceType,
      input.resourceId ?? null,
      input.outcome,
      input.traceId,
      input.correlationId,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
}

export interface PlatformAdministrationRepository {
  bootstrapFounder(input: {
    userId: string;
    notes?: string;
    traceId: string;
    correlationId: string;
  }): Promise<BootstrapDecision>;
  hasPermission(userId: string, permissionKey: string): Promise<boolean>;
  listPermissions(userId: string): Promise<string[]>;
  recordAudit(input: PlatformAuditInput): Promise<void>;
}

export function createPostgresPlatformAdministrationRepository(): PlatformAdministrationRepository {
  return {
    async bootstrapFounder(input) {
      return withTransaction(async (client) => {
        await client.query(
          "SELECT pg_advisory_xact_lock(hashtext('boss.platform_super_admin.bootstrap'))",
        );

        const existing = await client.query<{ user_id: string }>(
          `SELECT user_id
           FROM platform_super_admins
           WHERE revoked_at IS NULL
           LIMIT 1`,
        );
        if (existing.rowCount && existing.rowCount > 0) {
          await insertAudit(client, {
            actorId: input.userId,
            action: "platform.super_admin.bootstrap",
            resourceType: "platform_role_assignment",
            resourceId: input.userId,
            outcome: "denied",
            traceId: input.traceId,
            correlationId: input.correlationId,
            metadata: { reason: "already_bootstrapped" },
          });
          return { status: "already_bootstrapped" } as const;
        }

        const membership = await client.query<{ exists: boolean }>(
          `SELECT EXISTS (
             SELECT 1
             FROM organization_memberships
             WHERE user_id = $1
               AND role = 'owner'
               AND status = 'active'
           ) AS exists`,
          [input.userId],
        );
        if (!membership.rows[0]?.exists) {
          await insertAudit(client, {
            actorId: input.userId,
            action: "platform.super_admin.bootstrap",
            resourceType: "platform_role_assignment",
            resourceId: input.userId,
            outcome: "denied",
            traceId: input.traceId,
            correlationId: input.correlationId,
            metadata: { reason: "founder_relationship_required" },
          });
          return { status: "founder_relationship_required" } as const;
        }

        const result = await client.query<AssignmentRow>(
          `INSERT INTO platform_super_admins (
             user_id, role_key, granted_by, notes
           ) VALUES ($1, 'platform_super_admin', $1, $2)
           RETURNING user_id, role_key, granted_by, granted_at, revoked_at, notes`,
          [input.userId, input.notes ?? null],
        );
        const row = result.rows[0];
        if (!row) {
          throw new Error("Platform Super Administrator grant returned no assignment.");
        }

        await insertAudit(client, {
          actorId: input.userId,
          action: "platform.super_admin.bootstrap",
          resourceType: "platform_role_assignment",
          resourceId: input.userId,
          outcome: "success",
          traceId: input.traceId,
          correlationId: input.correlationId,
          metadata: { roleKey: "platform_super_admin" },
        });

        return { status: "granted", assignment: assignment(row) } as const;
      });
    },

    async hasPermission(userId, permissionKey) {
      const rows = await query<{ allowed: boolean }>(
        `SELECT EXISTS (
           SELECT 1
           FROM platform_super_admins assignment
           JOIN platform_role_permissions role_permission
             ON role_permission.role_key = assignment.role_key
           JOIN platform_permissions permission
             ON permission.permission_key = role_permission.permission_key
           WHERE assignment.user_id = $1
             AND assignment.revoked_at IS NULL
             AND permission.permission_key = $2
             AND COALESCE(role_permission.conditions ->> 'assignment_status', 'active') = 'active'
         ) AS allowed`,
        [userId, permissionKey],
      );
      return rows[0]?.allowed ?? false;
    },

    async listPermissions(userId) {
      const rows = await query<{ permission_key: string }>(
        `SELECT permission.permission_key
         FROM platform_super_admins assignment
         JOIN platform_role_permissions role_permission
           ON role_permission.role_key = assignment.role_key
         JOIN platform_permissions permission
           ON permission.permission_key = role_permission.permission_key
         WHERE assignment.user_id = $1
           AND assignment.revoked_at IS NULL
           AND COALESCE(role_permission.conditions ->> 'assignment_status', 'active') = 'active'
         ORDER BY permission.permission_key`,
        [userId],
      );
      return rows.map((row) => row.permission_key);
    },

    async recordAudit(input) {
      await withTransaction((client) => insertAudit(client, input));
    },
  };
}

