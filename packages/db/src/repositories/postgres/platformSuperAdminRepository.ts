import { query, firstRow } from "../../client.js";

export interface PlatformSuperAdmin {
  readonly userId: string;
  readonly grantedBy: string;
  readonly grantedAt: string;
  readonly revokedAt: string | null;
  readonly notes: string | null;
}

interface SuperAdminRow {
  user_id: string;
  granted_by: string;
  granted_at: string;
  revoked_at: string | null;
  notes: string | null;
}

function toSuperAdmin(row: SuperAdminRow): PlatformSuperAdmin {
  return Object.freeze({
    userId: row.user_id,
    grantedBy: row.granted_by,
    grantedAt: row.granted_at,
    revokedAt: row.revoked_at,
    notes: row.notes,
  });
}

export interface PlatformSuperAdminRepository {
  isActive(userId: string): Promise<boolean>;
  grant(userId: string, grantedBy: string, notes?: string): Promise<PlatformSuperAdmin>;
  revoke(userId: string, revokedBy: string): Promise<void>;
  list(): Promise<PlatformSuperAdmin[]>;
}

export function createPostgresPlatformSuperAdminRepository(): PlatformSuperAdminRepository {
  return {
    async isActive(userId) {
      const rows = await query<{ exists: boolean }>(
        `SELECT EXISTS (
           SELECT 1 FROM platform_super_admins
           WHERE user_id = $1 AND revoked_at IS NULL
         ) AS exists`,
        [userId],
      );
      return rows[0]?.exists ?? false;
    },

    async grant(userId, grantedBy, notes) {
      const rows = await query<SuperAdminRow>(
        `INSERT INTO platform_super_admins (user_id, granted_by, notes)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET
           revoked_at = NULL,
           granted_by = EXCLUDED.granted_by,
           granted_at = now(),
           notes = EXCLUDED.notes
         RETURNING *`,
        [userId, grantedBy, notes ?? null],
      );
      return toSuperAdmin(firstRow(rows));
    },

    async revoke(userId, _revokedBy) {
      await query(
        `UPDATE platform_super_admins SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
        [userId],
      );
    },

    async list() {
      const rows = await query<SuperAdminRow>(
        `SELECT * FROM platform_super_admins ORDER BY granted_at DESC`,
        [],
      );
      return rows.map(toSuperAdmin);
    },
  };
}
