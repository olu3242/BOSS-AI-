import type {
  Organization,
  OrganizationMembershipRecord,
  OrganizationRole,
} from "@boss/types";
import { firstRow, query, withTransaction } from "../../client.js";
import type { OrganizationRepository } from "../types.js";

interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: Organization["status"];
  created_at: string;
}

interface MembershipRow {
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  membership_status: OrganizationMembershipRecord["status"];
  id: string;
  name: string;
  slug: string;
  plan: string;
  organization_status: Organization["status"];
  created_at: string;
}

function toOrganization(row: OrganizationRow): Organization {
  return Object.freeze({
    id: row.id,
    name: row.name,
    slug: row.slug,
    plan: row.plan,
    status: row.status,
    createdAt: row.created_at,
  });
}

function toMembership(row: MembershipRow): OrganizationMembershipRecord {
  return Object.freeze({
    userId: row.user_id,
    orgId: row.organization_id,
    role: row.role,
    status: row.membership_status,
  });
}

function organizationFromMembership(row: MembershipRow): Organization {
  return Object.freeze({
    id: row.id,
    name: row.name,
    slug: row.slug,
    plan: row.plan,
    status: row.organization_status,
    createdAt: row.created_at,
  });
}

export function createPostgresOrganizationRepository(): OrganizationRepository {
  return {
    async create(userId, input) {
      return withTransaction(async (client) => {
        const result = await client.query<OrganizationRow>(
          `INSERT INTO organizations (name, slug, created_by)
           VALUES ($1, $2, $3)
           RETURNING id, name, slug, plan, status, created_at`,
          [input.name, input.slug, userId],
        );
        const organization = toOrganization(firstRow(result.rows));
        await client.query(
          `INSERT INTO organization_memberships (
             organization_id, user_id, role, status
           ) VALUES ($1, $2, 'owner', 'active')`,
          [organization.id, userId],
        );
        await client.query(
          `INSERT INTO user_tenant_preferences (user_id, active_organization_id)
           VALUES ($1, $2)
           ON CONFLICT (user_id) DO UPDATE SET
             active_organization_id = EXCLUDED.active_organization_id,
             updated_at = now()`,
          [userId, organization.id],
        );
        return Object.freeze({
          organization,
          membership: Object.freeze({
            userId,
            orgId: organization.id,
            role: "owner" as const,
            status: "active" as const,
          }),
        });
      });
    },
    async getMembership(userId, orgId) {
      const rows = await query<{
        organization_id: string;
        user_id: string;
        role: OrganizationRole;
        status: OrganizationMembershipRecord["status"];
      }>(
        `SELECT organization_id, user_id, role, status
         FROM organization_memberships
         WHERE user_id = $1 AND organization_id = $2`,
        [userId, orgId],
      );
      const row = rows[0];
      return row
        ? Object.freeze({
            userId: row.user_id,
            orgId: row.organization_id,
            role: row.role,
            status: row.status,
          })
        : undefined;
    },
    async listForUser(userId) {
      const rows = await query<MembershipRow>(
        `SELECT
           membership.organization_id,
           membership.user_id,
           membership.role,
           membership.status AS membership_status,
           organization.id,
           organization.name,
           organization.slug,
           organization.plan,
           organization.status AS organization_status,
           organization.created_at
         FROM organization_memberships membership
         JOIN organizations organization
           ON organization.id = membership.organization_id
         WHERE membership.user_id = $1
           AND membership.status = 'active'
           AND organization.deleted_at IS NULL
         ORDER BY organization.created_at`,
        [userId],
      );
      return Object.freeze(
        rows.map((row) =>
          Object.freeze({
            organization: organizationFromMembership(row),
            membership: toMembership(row),
          }),
        ),
      );
    },
    async getActive(userId) {
      const rows = await query<OrganizationRow>(
        `SELECT organization.id, organization.name, organization.slug,
                organization.plan, organization.status, organization.created_at
         FROM user_tenant_preferences preference
         JOIN organization_memberships membership
           ON membership.organization_id = preference.active_organization_id
          AND membership.user_id = preference.user_id
          AND membership.status = 'active'
         JOIN organizations organization
           ON organization.id = preference.active_organization_id
         WHERE preference.user_id = $1
           AND organization.deleted_at IS NULL`,
        [userId],
      );
      return rows[0] ? toOrganization(rows[0]) : null;
    },
    async setActive(userId, orgId) {
      const rows = await query<OrganizationRow>(
        `WITH allowed AS (
           SELECT organization.id, organization.name, organization.slug,
                  organization.plan, organization.status, organization.created_at
           FROM organizations organization
           JOIN organization_memberships membership
             ON membership.organization_id = organization.id
           WHERE organization.id = $2
             AND membership.user_id = $1
             AND membership.status = 'active'
             AND organization.deleted_at IS NULL
         ),
         selected AS (
           INSERT INTO user_tenant_preferences (user_id, active_organization_id)
           SELECT $1, id FROM allowed
           ON CONFLICT (user_id) DO UPDATE SET
             active_organization_id = EXCLUDED.active_organization_id,
             updated_at = now()
           RETURNING active_organization_id
         )
         SELECT allowed.* FROM allowed
         JOIN selected ON selected.active_organization_id = allowed.id`,
        [userId, orgId],
      );
      const row = rows[0];
      if (!row) {
        throw new Error("The user is not an active member of the organization.");
      }
      return toOrganization(row);
    },
  };
}
