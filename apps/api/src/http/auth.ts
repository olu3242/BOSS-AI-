import { createPostgresPlatformSuperAdminRepository } from "@boss/db";
import { createRemoteJWKSet, jwtVerify, SignJWT, type JWTVerifyGetKey } from "jose";
import type { SuperAdminSession } from "../security.js";
import { ApiError } from "./apiError.js";

export type UserRole = "owner" | "admin" | "member" | "viewer";

const ROLE_LEVELS: Record<UserRole, number> = { owner: 4, admin: 3, member: 2, viewer: 1 };

const encoder = new TextEncoder();

// Prefer remote JWKS (ES256 — Supabase default for new projects, handles key rotation).
// Fall back to symmetric HS256 secret for local dev / older projects.
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const JWKS: JWTVerifyGetKey | null = supabaseUrl
  ? createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`))
  : null;

function symmetricSecret(): Uint8Array {
  const secret = process.env.SUPABASE_JWT_SECRET ?? "dev-only-insecure-secret-do-not-use-in-production";
  return encoder.encode(secret);
}

async function verifyToken(token: string): Promise<Record<string, unknown>> {
  if (JWKS) {
    return (await jwtVerify(token, JWKS)).payload as Record<string, unknown>;
  }
  return (await jwtVerify(token, symmetricSecret())).payload as Record<string, unknown>;
}

/**
 * Verifies a Supabase-issued JWT (HS256, `Authorization: Bearer <token>`) and
 * extracts the tenant id from its `org_id` claim. Supabase Auth doesn't carry
 * org_id natively — this assumes a custom access-token hook stamps it onto
 * every issued token (TD-030: that hook doesn't exist yet, so token minting
 * is still a dev placeholder; only verification is real).
 */
export async function requireOrgId(req: { header(name: string): string | undefined }): Promise<string> {
  const authHeader = req.header("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;
  if (!token) {
    throw new ApiError(401, "missing_token", "Authorization: Bearer <token> header is required");
  }

  let payload: Record<string, unknown>;
  try {
    payload = await verifyToken(token);
  } catch {
    throw new ApiError(401, "invalid_token", "Token signature is invalid or expired");
  }

  const orgId = payload.org_id;
  if (typeof orgId !== "string" || orgId.length === 0) {
    throw new ApiError(403, "missing_org_claim", "Token does not carry an org_id claim");
  }
  return orgId;
}

/**
 * Verifies the token and enforces a minimum role level.
 * Role claim `role` is stamped by the Supabase custom access-token hook (TD-030).
 * Defaults to "owner" when the claim is absent (backwards-compatible with
 * existing dev tokens that only carry org_id).
 */
export async function requireRole(
  req: { header(name: string): string | undefined },
  minRole: UserRole
): Promise<{ orgId: string; role: UserRole }> {
  const authHeader = req.header("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;
  if (!token) throw new ApiError(401, "missing_token", "Authorization: Bearer <token> header is required");

  let payload: Record<string, unknown>;
  try {
    payload = await verifyToken(token);
  } catch {
    throw new ApiError(401, "invalid_token", "Token signature is invalid or expired");
  }

  const orgId = payload.org_id;
  if (typeof orgId !== "string" || orgId.length === 0) {
    throw new ApiError(403, "missing_org_claim", "Token does not carry an org_id claim");
  }

  const rawRole = typeof payload.role === "string" ? payload.role : "owner";
  const role = (rawRole in ROLE_LEVELS ? rawRole : "owner") as UserRole;
  if ((ROLE_LEVELS[role] ?? 0) < (ROLE_LEVELS[minRole] ?? 0)) {
    throw new ApiError(403, "insufficient_role", `This action requires role '${minRole}' or higher`);
  }
  return { orgId, role };
}

/**
 * Mints a signed JWT carrying an `org_id` claim, standing in for what a
 * Supabase custom access-token hook would produce on real sign-in (TD-030 —
 * no real login UI exists yet). Exposed only via a non-production route so
 * the API/web flow has a token to use without faking the verification step.
 */
export async function mintDevToken(orgId: string, role: UserRole = "owner"): Promise<string> {
  const secret = process.env.SUPABASE_JWT_SECRET ?? "dev-only-insecure-secret-do-not-use-in-production";
  return new SignJWT({ org_id: orgId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("dev-user")
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(encoder.encode(secret));
}

/**
 * Verifies a JWT and checks that the sub (user_id) is an active platform super
 * admin. Throws 401/403 like the other requireX helpers — never returns null.
 */
export async function requireSuperAdmin(
  req: { header(name: string): string | undefined },
): Promise<SuperAdminSession> {
  const authHeader = req.header("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;
  if (!token) {
    throw new ApiError(401, "missing_token", "Authorization: Bearer <token> header is required");
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await jwtVerify(token, jwtSecret())).payload;
  } catch {
    throw new ApiError(401, "invalid_token", "Token signature is invalid or expired");
  }

  const userId = typeof payload.sub === "string" ? payload.sub : undefined;
  if (!userId) {
    throw new ApiError(403, "missing_sub_claim", "Token does not carry a sub (user_id) claim");
  }

  const repo = createPostgresPlatformSuperAdminRepository();
  const isActive = await repo.isActive(userId);
  if (!isActive) {
    throw new ApiError(403, "not_super_admin", "This action requires platform super admin access");
  }

  return { userId, isSuperAdmin: true };
}

/**
 * Grants super admin status. Requires `CRON_SECRET` in the Authorization
 * header — allows bootstrapping before any super admin exists.
 */
export function requireCronSecret(
  req: { header(name: string): string | undefined },
): void {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    throw new ApiError(503, "cron_secret_not_configured", "CRON_SECRET is not configured on this server");
  }
  const auth = req.header("authorization");
  const provided = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : undefined;
  if (provided !== cronSecret) {
    throw new ApiError(401, "invalid_cron_secret", "Invalid CRON_SECRET");
  }
}
