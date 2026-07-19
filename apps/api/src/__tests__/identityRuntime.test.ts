import { describe, expect, it } from "vitest";
import {
  authorizeRequest,
  AuthenticationError,
  IdentityRuntime,
  InMemoryMembershipStore,
  type IdentityProvider,
  type ProviderSession,
  type SignUpResult,
} from "../identity.js";
import { InMemoryAuditSink } from "../observability.js";
import { AuthorizationError } from "../security.js";
import { SupabaseIdentityProvider } from "../supabaseIdentityProvider.js";

class TestIdentityProvider implements IdentityProvider {
  private readonly sessions = new Map<string, ProviderSession>();
  private sequence = 0;

  async signUp(email: string, _password: string): Promise<SignUpResult> {
    return {
      identity: {
        userId: "user-1",
        email,
        emailVerified: false,
      },
      session: null,
      verificationRequired: true,
    };
  }

  async signIn(email: string, password: string): Promise<ProviderSession> {
    if (password !== "correct-password") {
      throw new AuthenticationError("Invalid credentials.");
    }
    this.sequence += 1;
    const session = this.session(email, this.sequence);
    this.sessions.set(session.accessToken, session);
    return session;
  }

  async verify(accessToken: string): Promise<ProviderSession> {
    const session = this.sessions.get(accessToken);
    if (!session) {
      throw new AuthenticationError("Session not found.");
    }
    return session;
  }

  async refresh(_refreshToken: string): Promise<ProviderSession> {
    this.sequence += 1;
    const session = this.session("owner@example.com", this.sequence);
    this.sessions.set(session.accessToken, session);
    return session;
  }

  async signOut(accessToken: string): Promise<void> {
    this.sessions.delete(accessToken);
  }

  async requestPasswordReset(_email: string): Promise<void> {}

  async updatePassword(_accessToken: string, password: string): Promise<void> {
    if (password === "rejected-password") {
      throw new AuthenticationError("Password update rejected.");
    }
  }

  private session(email: string, sequence: number): ProviderSession {
    return {
      identity: {
        userId: "user-1",
        email,
        emailVerified: true,
      },
      accessToken: `access-${sequence}`,
      refreshToken: `refresh-${sequence}`,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    };
  }
}

describe("IdentityRuntime", () => {
  it("creates Supabase identity provider from Next.js public Supabase runtime variables", () => {
    expect(() =>
      SupabaseIdentityProvider.fromEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key",
      } as NodeJS.ProcessEnv),
    ).not.toThrow();
  });

  it("supports verification-aware signup, sign-in, refresh, and logout", async () => {
    const audit = new InMemoryAuditSink();
    const runtime = new IdentityRuntime(
      new TestIdentityProvider(),
      new InMemoryMembershipStore(),
      audit,
    );

    const signup = await runtime.signUp("owner@example.com", "correct-password");
    expect(signup.verificationRequired).toBe(true);

    const signedIn = await runtime.signIn(
      "owner@example.com",
      "correct-password",
      true,
    );
    expect(signedIn.persistence).toBe("persistent");
    const refreshed = await runtime.refresh(signedIn.refreshToken);
    expect(refreshed.accessToken).not.toBe(signedIn.accessToken);
    await expect(runtime.verifySession(refreshed.accessToken)).resolves.toEqual(
      refreshed,
    );
    await runtime.requestPasswordReset("owner@example.com");
    await runtime.updatePassword(
      refreshed.accessToken,
      "replacement-password",
    );

    await runtime.signOut(refreshed.accessToken);
    await expect(runtime.organizations(refreshed.accessToken)).rejects.toThrow(
      AuthenticationError,
    );
    expect(audit.list("platform").map((event) => event.action)).toEqual([
      "identity.signup",
      "identity.signin",
      "identity.refresh",
      "identity.verification",
      "identity.password_reset_requested",
      "identity.password_reset_completed",
      "identity.signout",
    ]);
  });

  it("resolves organization context and enforces tenant RBAC", async () => {
    const provider = new TestIdentityProvider();
    const memberships = new InMemoryMembershipStore();
    const audit = new InMemoryAuditSink();
    const runtime = new IdentityRuntime(provider, memberships, audit);
    await memberships.save({
      userId: "user-1",
      orgId: "org-1",
      role: "owner",
      status: "active",
    });
    await memberships.save({
      userId: "user-1",
      orgId: "org-2",
      role: "viewer",
      status: "active",
    });
    const session = await runtime.signIn(
      "owner@example.com",
      "correct-password",
      false,
    );

    const authorized = await authorizeRequest(
      runtime,
      {
        authorization: `Bearer ${session.accessToken}`,
        "x-organization-id": "org-1",
        "x-request-id": "request-1",
        "x-trace-id": "trace-1",
      },
      "business:update",
    );
    expect(authorized.session).toEqual({
      userId: "user-1",
      orgId: "org-1",
      role: "owner",
    });

    await expect(
      runtime.authorize({
        accessToken: session.accessToken,
        orgId: "org-2",
        action: "business:update",
      }),
    ).rejects.toThrow(AuthorizationError);
    await expect(
      runtime.authorize({
        accessToken: session.accessToken,
        orgId: "org-3",
        action: "business:read",
      }),
    ).rejects.toThrow(AuthorizationError);
    expect((await runtime.organizations(session.accessToken))).toHaveLength(2);
  });

  it("audits failed authentication without exposing credentials", async () => {
    const audit = new InMemoryAuditSink();
    const runtime = new IdentityRuntime(
      new TestIdentityProvider(),
      new InMemoryMembershipStore(),
      audit,
    );

    await expect(
      runtime.signIn("owner@example.com", "wrong", false, "trace-failure"),
    ).rejects.toThrow(AuthenticationError);
    expect(audit.list("platform")).toEqual([
      expect.objectContaining({
        action: "identity.signin",
        actorId: "anonymous",
        outcome: "failure",
        metadata: {},
      }),
    ]);
  });
});
