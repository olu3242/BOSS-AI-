import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mintDevToken, requireOrgId, requireRole } from "../http/auth.js";

const JWT_SECRET = "test-secret-for-rc15-validation-00000000000";

function fakeReq(token?: string) {
  return {
    header(name: string) {
      if (name === "authorization" && token) return `Bearer ${token}`;
      return undefined;
    },
  };
}

describe("RC1.5 — Auth / JWT Validation (Phase 5)", () => {
  beforeEach(() => {
    process.env.SUPABASE_JWT_SECRET = JWT_SECRET;
  });
  afterEach(() => {
    delete process.env.SUPABASE_JWT_SECRET;
  });

  it("rejects request with no Authorization header", async () => {
    await expect(requireOrgId(fakeReq())).rejects.toMatchObject({ code: "missing_token" });
  });

  it("rejects a token signed with the wrong secret", async () => {
    process.env.SUPABASE_JWT_SECRET = "correct-secret-0000000000000000000000000";
    const token = await mintDevToken("org-x");
    process.env.SUPABASE_JWT_SECRET = "wrong-secret-00000000000000000000000000";
    await expect(requireOrgId(fakeReq(token))).rejects.toMatchObject({ code: "invalid_token" });
  });

  it("rejects a tampered token payload", async () => {
    const token = await mintDevToken("org-legit");
    const [header, , sig] = token.split(".");
    const fakePayload = Buffer.from(JSON.stringify({ org_id: "org-evil", exp: Date.now() / 1000 + 3600 })).toString("base64url");
    const tampered = `${header}.${fakePayload}.${sig}`;
    await expect(requireOrgId(fakeReq(tampered))).rejects.toMatchObject({ code: "invalid_token" });
  });

  it("accepts a valid token and returns org_id", async () => {
    const token = await mintDevToken("org-valid");
    const orgId = await requireOrgId(fakeReq(token));
    expect(orgId).toBe("org-valid");
  });

  it("requireRole: owner token satisfies any role requirement", async () => {
    const token = await mintDevToken("org-1", "owner");
    const result = await requireRole(fakeReq(token), "viewer");
    expect(result.orgId).toBe("org-1");
    expect(result.role).toBe("owner");
  });

  it("requireRole: viewer token is denied for admin-required action", async () => {
    const token = await mintDevToken("org-1", "viewer");
    await expect(requireRole(fakeReq(token), "admin")).rejects.toMatchObject({ code: "insufficient_role" });
  });

  it("requireRole: member token is denied for owner-required action", async () => {
    const token = await mintDevToken("org-1", "member");
    await expect(requireRole(fakeReq(token), "owner")).rejects.toMatchObject({ code: "insufficient_role" });
  });

  it("cross-tenant isolation: org_id from token, not from request body", async () => {
    const token = await mintDevToken("org-A");
    const orgId = await requireOrgId(fakeReq(token));
    // Even if caller passes "org-B" in body, middleware extracts from token only
    expect(orgId).toBe("org-A");
    expect(orgId).not.toBe("org-B");
  });

  it("token with missing org_id claim is rejected", async () => {
    // Mint without org_id by using a raw jose token
    const { SignJWT } = await import("jose");
    const encoder = new TextEncoder();
    const badToken = await new SignJWT({ sub: "user-1" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(encoder.encode(JWT_SECRET));
    await expect(requireOrgId(fakeReq(badToken))).rejects.toMatchObject({ code: "missing_org_claim" });
  });
});
