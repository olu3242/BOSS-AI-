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
