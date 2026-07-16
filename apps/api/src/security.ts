import type { OrganizationRole } from "@boss/types";

export type PlatformRole = OrganizationRole;

export type PlatformAction =
  | "business:create"
  | "business:read"
  | "business:update"
  | "mri:write"
  | "intelligence:run"
  | "recommendation:approve"
  | "admin:manage";

// ── Platform Super Admin ─────────────────────────────────────────────────────

export type SuperAdminAction =
  | "platform:organizations:list"
  | "platform:organizations:read"
  | "platform:organizations:suspend"
  | "platform:organizations:restore"
  | "platform:users:list"
  | "platform:users:read"
  | "platform:users:assign_role"
  | "platform:super_admins:grant"
  | "platform:super_admins:revoke"
  | "platform:super_admins:list"
  | "platform:audit:read"
  | "platform:flags:manage"
  | "platform:config:read"
  | "platform:health:read"
  | "platform:billing:read"
  | "platform:workers:manage"
  | "platform:queues:manage"
  | "platform:integrations:manage"
  | "platform:security:manage";

/** All super admin actions. Super admins receive every action. */
export const ALL_SUPER_ADMIN_ACTIONS: ReadonlySet<SuperAdminAction> = new Set([
  "platform:organizations:list",
  "platform:organizations:read",
  "platform:organizations:suspend",
  "platform:organizations:restore",
  "platform:users:list",
  "platform:users:read",
  "platform:users:assign_role",
  "platform:super_admins:grant",
  "platform:super_admins:revoke",
  "platform:super_admins:list",
  "platform:audit:read",
  "platform:flags:manage",
  "platform:config:read",
  "platform:health:read",
  "platform:billing:read",
  "platform:workers:manage",
  "platform:queues:manage",
  "platform:integrations:manage",
  "platform:security:manage",
]);

export interface SuperAdminSession {
  readonly userId: string;
  readonly isSuperAdmin: true;
}

export function assertSuperAdminAction(
  session: SuperAdminSession,
  action: SuperAdminAction,
): void {
  if (!ALL_SUPER_ADMIN_ACTIONS.has(action)) {
    throw new AuthorizationError(`Unknown super admin action "${action}".`);
  }
  // Super admins hold all platform actions by definition.
  void session;
}

export interface PlatformSession {
  userId: string;
  orgId: string;
  role: PlatformRole;
}

const ROLE_PERMISSIONS: Record<PlatformRole, ReadonlySet<PlatformAction>> = {
  owner: new Set([
    "business:create",
    "business:read",
    "business:update",
    "mri:write",
    "intelligence:run",
    "recommendation:approve",
    "admin:manage",
  ]),
  admin: new Set([
    "business:create",
    "business:read",
    "business:update",
    "mri:write",
    "intelligence:run",
    "recommendation:approve",
  ]),
  operator: new Set(["business:read", "business:update", "mri:write", "intelligence:run"]),
  viewer: new Set(["business:read"]),
};

export class AuthorizationError extends Error {
  readonly code = "AUTHORIZATION_DENIED";

  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function canAccessOrg(session: PlatformSession, orgId: string): boolean {
  return session.orgId === orgId;
}

export function hasPermission(session: PlatformSession, action: PlatformAction): boolean {
  return ROLE_PERMISSIONS[session.role].has(action);
}

export function assertPlatformAccess(session: PlatformSession, orgId: string, action: PlatformAction): void {
  if (!canAccessOrg(session, orgId)) {
    throw new AuthorizationError("Session is not scoped to the requested organization.");
  }

  if (!hasPermission(session, action)) {
    throw new AuthorizationError(`Role "${session.role}" cannot perform action "${action}".`);
  }
}
