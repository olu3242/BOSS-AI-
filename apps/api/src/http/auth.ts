import { jwtVerify, SignJWT } from "jose";
import { ApiError } from "./apiError.js";

export type UserRole = "owner" | "admin" | "member" | "viewer";

const ROLE_LEVELS: Record<UserRole, number> = { owner: 4, admin: 3, member: 2, viewer: 1 };

const encoder = new TextEncoder();

function jwtSecret(): Uint8Array {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new ApiError(500, "missing_jwt_secret", "SUPABASE_JWT_SECRET is not configured");
  }
  return encoder.encode(secret);
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
    payload = (await jwtVerify(token, jwtSecret())).payload;
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
    payload = (await jwtVerify(token, jwtSecret())).payload;
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
  return new SignJWT({ org_id: orgId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("dev-user")
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(jwtSecret());
}
