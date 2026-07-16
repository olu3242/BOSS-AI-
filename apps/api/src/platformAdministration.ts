import { createHash, timingSafeEqual } from "node:crypto";
import {
  createPostgresPlatformAdministrationRepository,
  type PlatformAdministrationRepository,
  type PlatformAuditInput,
} from "@boss/db";
import { z } from "zod";
import type { IdentityProvider, ProviderSession } from "./identity.js";
import { SupabaseIdentityProvider } from "./supabaseIdentityProvider.js";

export class PlatformAdministrationError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "PlatformAdministrationError";
  }
}

export interface PlatformRequestIdentity {
  userId: string;
  email: string;
  emailVerified: boolean;
  accessToken: string;
}

function bearerToken(authorization: string | undefined): string {
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    throw new PlatformAdministrationError(
      401,
      "missing_token",
      "Authorization: Bearer <Supabase access token> is required.",
    );
  }
  return token;
}

function secureSecretMatch(provided: string | undefined, expected: string): boolean {
  if (!provided) return false;
  const expectedDigest = createHash("sha256").update(expected).digest();
  const providedDigest = createHash("sha256").update(provided).digest();
  return timingSafeEqual(expectedDigest, providedDigest);
}

function activeSession(session: ProviderSession): PlatformRequestIdentity {
  if (Date.parse(session.expiresAt) <= Date.now()) {
    throw new PlatformAdministrationError(401, "expired_token", "The authenticated session has expired.");
  }
  return {
    userId: session.identity.userId,
    email: session.identity.email,
    emailVerified: session.identity.emailVerified,
    accessToken: session.accessToken,
  };
}

async function recordAuditWithRetry(
  repository: PlatformAdministrationRepository,
  event: PlatformAuditInput,
): Promise<void> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await repository.recordAudit({
        ...event,
        metadata: { ...(event.metadata ?? {}), auditAttempt: attempt },
      });
      return;
    } catch {
      // Retry below. The underlying database error is intentionally not
      // returned to privileged clients.
    }
  }
  throw new PlatformAdministrationError(
    503,
    "audit_unavailable",
    "The privileged action was stopped because its audit event could not be persisted.",
  );
}

export interface PlatformAdministrationService {
  bootstrapFounder(input: {
    authorization?: string;
    bootstrapSecret?: string;
    payload?: unknown;
    traceId: string;
    correlationId: string;
  }): Promise<{
    assignment: {
      userId: string;
      roleKey: string;
      grantedAt: string;
    };
  }>;
  authorize(input: {
    authorization?: string;
    permissionKey: string;
    traceId: string;
    correlationId: string;
  }): Promise<PlatformRequestIdentity>;
  permissions(input: {
    authorization?: string;
    traceId: string;
    correlationId: string;
  }): Promise<string[]>;
}

export function createPlatformAdministrationService(
  options: {
    identityProvider?: IdentityProvider & {
      verifyPlatformUser(userId: string): Promise<{
        userId: string;
        email: string;
        emailVerified: boolean;
      }>;
    };
    repository?: PlatformAdministrationRepository;
    environment?: NodeJS.ProcessEnv;
  } = {},
): PlatformAdministrationService {
  const environment = options.environment ?? process.env;
  const identityProvider =
    options.identityProvider ?? SupabaseIdentityProvider.fromEnvironment(environment);
  const repository =
    options.repository ?? createPostgresPlatformAdministrationRepository();

  async function authenticate(
    authorization: string | undefined,
    traceId: string,
    correlationId: string,
  ): Promise<PlatformRequestIdentity> {
    let token: string;
    try {
      token = bearerToken(authorization);
    } catch (error) {
      await recordAuditWithRetry(repository, {
        actorId: "anonymous",
        action: "platform.authentication",
        resourceType: "platform_session",
        outcome: "denied",
        traceId,
        correlationId,
        metadata: { reason: "missing_token" },
      });
      throw error;
    }

    try {
      const session = activeSession(await identityProvider.verify(token));
      const privilegedIdentity = await identityProvider.verifyPlatformUser(
        session.userId,
      );
      if (privilegedIdentity.userId !== session.userId) {
        throw new PlatformAdministrationError(
          403,
          "identity_mismatch",
          "The authenticated and privileged identities do not match.",
        );
      }
      return {
        ...session,
        email: privilegedIdentity.email,
        emailVerified: privilegedIdentity.emailVerified,
      };
    } catch (error) {
      await recordAuditWithRetry(repository, {
        actorId: "anonymous",
        action: "platform.authentication",
        resourceType: "platform_session",
        outcome: "denied",
        traceId,
        correlationId,
        metadata: { reason: "invalid_or_inactive_session" },
      });
      if (error instanceof PlatformAdministrationError) throw error;
      throw new PlatformAdministrationError(
        401,
        "invalid_token",
        "The Supabase session is invalid, inactive, deleted, or expired.",
      );
    }
  }

  return {
    async bootstrapFounder(input) {
      const identity = await authenticate(
        input.authorization,
        input.traceId,
        input.correlationId,
      );

      const configuredSecret = environment.PLATFORM_BOOTSTRAP_SECRET;
      if (!configuredSecret) {
        await recordAuditWithRetry(repository, {
          actorId: identity.userId,
          action: "platform.super_admin.bootstrap",
          resourceType: "platform_role_assignment",
          resourceId: identity.userId,
          outcome: "failure",
          traceId: input.traceId,
          correlationId: input.correlationId,
          metadata: { reason: "bootstrap_secret_not_configured" },
        });
        throw new PlatformAdministrationError(
          503,
          "bootstrap_secret_not_configured",
          "The bootstrap secret is not configured.",
        );
      }

      if (!secureSecretMatch(input.bootstrapSecret, configuredSecret)) {
        await recordAuditWithRetry(repository, {
          actorId: identity.userId,
          action: "platform.super_admin.bootstrap",
          resourceType: "platform_role_assignment",
          resourceId: identity.userId,
          outcome: "denied",
          traceId: input.traceId,
          correlationId: input.correlationId,
          metadata: { reason: "invalid_bootstrap_secret" },
        });
        throw new PlatformAdministrationError(
          401,
          "invalid_bootstrap_secret",
          "The bootstrap secret is invalid.",
        );
      }

      const parsedPayload = z
        .object({
          notes: z.string().trim().min(1).max(500).optional(),
        })
        .strict()
        .safeParse(input.payload ?? {});
      if (!parsedPayload.success) {
        await recordAuditWithRetry(repository, {
          actorId: identity.userId,
          action: "platform.super_admin.bootstrap",
          resourceType: "platform_role_assignment",
          resourceId: identity.userId,
          outcome: "denied",
          traceId: input.traceId,
          correlationId: input.correlationId,
          metadata: { reason: "invalid_body" },
        });
        throw new PlatformAdministrationError(
          400,
          "invalid_body",
          "Only an optional notes field is accepted.",
        );
      }

      if (!identity.email || !identity.emailVerified) {
        await recordAuditWithRetry(repository, {
          actorId: identity.userId,
          action: "platform.super_admin.bootstrap",
          resourceType: "platform_role_assignment",
          resourceId: identity.userId,
          outcome: "denied",
          traceId: input.traceId,
          correlationId: input.correlationId,
          metadata: { reason: "verified_email_required" },
        });
        throw new PlatformAdministrationError(
          403,
          "verified_email_required",
          "A verified email address is required for founder bootstrap.",
        );
      }

      const decision = await repository.bootstrapFounder({
        userId: identity.userId,
        notes: parsedPayload.data.notes,
        traceId: input.traceId,
        correlationId: input.correlationId,
      });
      if (decision.status === "already_bootstrapped") {
        throw new PlatformAdministrationError(
          409,
          "already_bootstrapped",
          "The one-time Platform Super Administrator bootstrap has already completed.",
        );
      }
      if (decision.status === "founder_relationship_required") {
        throw new PlatformAdministrationError(
          403,
          "founder_relationship_required",
          "The authenticated identity must be an active organization owner.",
        );
      }

      return {
        assignment: {
          userId: decision.assignment.userId,
          roleKey: decision.assignment.roleKey,
          grantedAt: decision.assignment.grantedAt,
        },
      };
    },

    async authorize(input) {
      const identity = await authenticate(
        input.authorization,
        input.traceId,
        input.correlationId,
      );
      const allowed = await repository.hasPermission(identity.userId, input.permissionKey);
      if (!allowed) {
        await recordAuditWithRetry(repository, {
          actorId: identity.userId,
          action: input.permissionKey,
          resourceType: "platform_authorization",
          resourceId: identity.userId,
          outcome: "denied",
          traceId: input.traceId,
          correlationId: input.correlationId,
          metadata: { reason: "permission_not_granted" },
        });
        throw new PlatformAdministrationError(
          403,
          "platform_permission_denied",
          `The authenticated identity does not have permission "${input.permissionKey}".`,
        );
      }
      return identity;
    },

    async permissions(input) {
      const identity = await authenticate(
        input.authorization,
        input.traceId,
        input.correlationId,
      );
      return repository.listPermissions(identity.userId);
    },
  };
}
