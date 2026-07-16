import { describe, expect, it, vi } from "vitest";
import type {
  PlatformAdministrationRepository,
  PlatformAuditInput,
} from "@boss/db";
import type {
  IdentityProvider,
  ProviderSession,
  SignUpResult,
} from "../identity.js";
import {
  createPlatformAdministrationService,
  PlatformAdministrationError,
} from "../platformAdministration.js";

const VERIFIED_SESSION: ProviderSession = {
  identity: {
    userId: "51219a62-26c8-4e20-8fdc-8eeb76b661b8",
    email: "founder@example.com",
    emailVerified: true,
  },
  accessToken: "verified-access-token",
  refreshToken: "",
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
};

function identityProvider(
  session: ProviderSession = VERIFIED_SESSION,
  platformIdentity: ProviderSession["identity"] = session.identity,
): IdentityProvider & {
  verifyPlatformUser(userId: string): Promise<ProviderSession["identity"]>;
} {
  return {
    signUp: vi.fn<() => Promise<SignUpResult>>(),
    signIn: vi.fn<() => Promise<ProviderSession>>(),
    verify: vi.fn(async () => session),
    verifyPlatformUser: vi.fn(async () => platformIdentity),
    refresh: vi.fn<() => Promise<ProviderSession>>(),
    signOut: vi.fn<() => Promise<void>>(),
    requestPasswordReset: vi.fn<() => Promise<void>>(),
    updatePassword: vi.fn<() => Promise<void>>(),
  };
}

function repository(overrides: Partial<PlatformAdministrationRepository> = {}) {
  const audits: PlatformAuditInput[] = [];
  const repo: PlatformAdministrationRepository = {
    bootstrapFounder: vi.fn(async (input) => ({
      status: "granted" as const,
      assignment: {
        userId: input.userId,
        roleKey: "platform_super_admin",
        grantedBy: input.userId,
        grantedAt: new Date().toISOString(),
        revokedAt: null,
        notes: input.notes ?? null,
      },
    })),
    hasPermission: vi.fn(async () => true),
    listPermissions: vi.fn(async () => ["platform.dashboard.read"]),
    recordAudit: vi.fn(async (input) => {
      audits.push(input);
    }),
    ...overrides,
  };
  return { repo, audits };
}

function service(
  options: {
    session?: ProviderSession;
    platformIdentity?: ProviderSession["identity"];
    repository?: Partial<PlatformAdministrationRepository>;
    secret?: string;
  } = {},
) {
  const { repo, audits } = repository(options.repository);
  return {
    service: createPlatformAdministrationService({
      identityProvider: identityProvider(
        options.session,
        options.platformIdentity ?? options.session?.identity,
      ),
      repository: repo,
      environment: {
        PLATFORM_BOOTSTRAP_SECRET: options.secret ?? "bootstrap-secret",
      },
    }),
    repo,
    audits,
  };
}

const request = {
  authorization: "Bearer verified-access-token",
  bootstrapSecret: "bootstrap-secret",
  payload: {},
  traceId: "trace-1",
  correlationId: "correlation-1",
};

describe("secure Platform Super Administrator bootstrap", () => {
  it("derives the founder ID exclusively from the verified Supabase session", async () => {
    const { service: platform, repo } = service();

    const result = await platform.bootstrapFounder(request);

    expect(result.assignment.userId).toBe(VERIFIED_SESSION.identity.userId);
    expect(repo.bootstrapFounder).toHaveBeenCalledWith(
      expect.objectContaining({ userId: VERIFIED_SESSION.identity.userId }),
    );
  });

  it("rejects an invalid bootstrap secret and records a denied audit event", async () => {
    const { service: platform, repo, audits } = service();

    await expect(
      platform.bootstrapFounder({ ...request, bootstrapSecret: "wrong" }),
    ).rejects.toMatchObject({
      status: 401,
      code: "invalid_bootstrap_secret",
    });

    expect(repo.bootstrapFounder).not.toHaveBeenCalled();
    expect(audits).toContainEqual(
      expect.objectContaining({
        actorId: VERIFIED_SESSION.identity.userId,
        action: "platform.super_admin.bootstrap",
        outcome: "denied",
        traceId: "trace-1",
        correlationId: "correlation-1",
      }),
    );
  });

  it("rejects an identity without a verified email", async () => {
    const { service: platform, repo } = service({
      session: {
        ...VERIFIED_SESSION,
        identity: { ...VERIFIED_SESSION.identity, emailVerified: false },
      },
    });

    await expect(platform.bootstrapFounder(request)).rejects.toMatchObject({
      status: 403,
      code: "verified_email_required",
    });
    expect(repo.bootstrapFounder).not.toHaveBeenCalled();
  });

  it("rejects a mismatch between the session identity and Supabase Admin record", async () => {
    const { service: platform, repo } = service({
      platformIdentity: {
        ...VERIFIED_SESSION.identity,
        userId: "different-user",
      },
    });

    await expect(platform.bootstrapFounder(request)).rejects.toMatchObject({
      status: 403,
      code: "identity_mismatch",
    });
    expect(repo.bootstrapFounder).not.toHaveBeenCalled();
  });

  it("rejects and audits any request-body userId", async () => {
    const { service: platform, repo, audits } = service();

    await expect(
      platform.bootstrapFounder({
        ...request,
        payload: { userId: "attacker-selected-user" },
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "invalid_body",
    });
    expect(repo.bootstrapFounder).not.toHaveBeenCalled();
    expect(audits).toContainEqual(
      expect.objectContaining({
        actorId: VERIFIED_SESSION.identity.userId,
        outcome: "denied",
        metadata: expect.objectContaining({ reason: "invalid_body" }),
      }),
    );
  });

  it("rejects a second bootstrap without rewriting the existing assignment", async () => {
    const { service: platform } = service({
      repository: {
        bootstrapFounder: vi.fn(async () => ({
          status: "already_bootstrapped" as const,
        })),
      },
    });

    await expect(platform.bootstrapFounder(request)).rejects.toMatchObject({
      status: 409,
      code: "already_bootstrapped",
    });
  });

  it("requires an active owner relationship verified by the repository transaction", async () => {
    const { service: platform } = service({
      repository: {
        bootstrapFounder: vi.fn(async () => ({
          status: "founder_relationship_required" as const,
        })),
      },
    });

    await expect(platform.bootstrapFounder(request)).rejects.toMatchObject({
      status: 403,
      code: "founder_relationship_required",
    });
  });

  it("stops the action when a required audit event cannot be persisted after retries", async () => {
    const recordAudit = vi.fn(async () => {
      throw new Error("database unavailable");
    });
    const { service: platform, repo } = service({
      repository: { recordAudit },
    });

    await expect(
      platform.bootstrapFounder({ ...request, bootstrapSecret: "wrong" }),
    ).rejects.toBeInstanceOf(PlatformAdministrationError);
    await expect(
      platform.bootstrapFounder({ ...request, bootstrapSecret: "wrong" }),
    ).rejects.toMatchObject({
      status: 503,
      code: "audit_unavailable",
    });
    expect(recordAudit).toHaveBeenCalledTimes(6);
    expect(repo.bootstrapFounder).not.toHaveBeenCalled();
  });

  it("authorizes platform access from database-backed explicit permissions", async () => {
    const { service: platform, repo } = service();

    const identity = await platform.authorize({
      authorization: request.authorization,
      permissionKey: "platform.dashboard.read",
      traceId: request.traceId,
      correlationId: request.correlationId,
    });

    expect(identity.userId).toBe(VERIFIED_SESSION.identity.userId);
    expect(repo.hasPermission).toHaveBeenCalledWith(
      VERIFIED_SESSION.identity.userId,
      "platform.dashboard.read",
    );
  });

  it("audits permission denial and never treats platform membership as a wildcard", async () => {
    const { service: platform, audits } = service({
      repository: { hasPermission: vi.fn(async () => false) },
    });

    await expect(
      platform.authorize({
        authorization: request.authorization,
        permissionKey: "platform.emergency.execute",
        traceId: request.traceId,
        correlationId: request.correlationId,
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "platform_permission_denied",
    });
    expect(audits).toContainEqual(
      expect.objectContaining({
        action: "platform.emergency.execute",
        outcome: "denied",
      }),
    );
  });
});
