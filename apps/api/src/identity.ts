import type { PlatformAction, PlatformRole, PlatformSession } from "./security.js";
import { assertPlatformAccess, AuthorizationError } from "./security.js";
import {
  createAuditEvent,
  createTraceId,
  type AuditSink,
} from "./observability.js";

export interface Identity {
  readonly userId: string;
  readonly email: string;
  readonly emailVerified: boolean;
}

export interface ProviderSession {
  readonly identity: Identity;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: string;
}

export interface SignUpResult {
  readonly identity: Identity;
  readonly session: ProviderSession | null;
  readonly verificationRequired: boolean;
}

export interface IdentityProvider {
  signUp(email: string, password: string): Promise<SignUpResult>;
  signIn(email: string, password: string): Promise<ProviderSession>;
  verify(accessToken: string): Promise<ProviderSession>;
  refresh(refreshToken: string): Promise<ProviderSession>;
  signOut(accessToken: string): Promise<void>;
  requestPasswordReset(email: string, redirectTo?: string): Promise<void>;
  updatePassword(accessToken: string, password: string): Promise<void>;
}

export interface OrganizationMembership {
  readonly userId: string;
  readonly orgId: string;
  readonly role: PlatformRole;
  readonly status: "active" | "suspended";
}

export interface MembershipStore {
  get(userId: string, orgId: string): Promise<OrganizationMembership | undefined>;
  list(userId: string): Promise<readonly OrganizationMembership[]>;
  save(membership: OrganizationMembership): Promise<void>;
}

export class InMemoryMembershipStore implements MembershipStore {
  private readonly memberships = new Map<string, OrganizationMembership>();

  async get(userId: string, orgId: string): Promise<OrganizationMembership | undefined> {
    return this.memberships.get(`${userId}:${orgId}`);
  }

  async list(userId: string): Promise<readonly OrganizationMembership[]> {
    return Object.freeze(
      Array.from(this.memberships.values()).filter(
        (membership) => membership.userId === userId,
      ),
    );
  }

  async save(membership: OrganizationMembership): Promise<void> {
    this.memberships.set(
      `${membership.userId}:${membership.orgId}`,
      Object.freeze(membership),
    );
  }
}

export interface AuthorizedRequestContext {
  readonly identity: Identity;
  readonly session: PlatformSession;
  readonly requestId: string;
  readonly traceId: string;
  readonly accessToken: string;
}

export interface AuthorizationInput {
  readonly accessToken: string;
  readonly orgId: string;
  readonly action: PlatformAction;
  readonly requestId?: string;
  readonly traceId?: string;
}

export class AuthenticationError extends Error {
  readonly code = "AUTHENTICATION_FAILED";

  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class IdentityRuntime {
  constructor(
    private readonly provider: IdentityProvider,
    private readonly memberships: MembershipStore,
    private readonly auditSink: AuditSink,
  ) {}

  async signUp(email: string, password: string, traceId = createTraceId()): Promise<SignUpResult> {
    let result: SignUpResult;
    try {
      result = await this.provider.signUp(email, password);
    } catch (error) {
      await this.audit("identity.signup", "anonymous", "platform", "failure", traceId);
      throw error;
    }
    await this.audit("identity.signup", result.identity.userId, "platform", "success", traceId);
    return result;
  }

  async signIn(
    email: string,
    password: string,
    rememberMe: boolean,
    traceId = createTraceId(),
  ): Promise<ProviderSession & { persistence: "session" | "persistent" }> {
    let session: ProviderSession;
    try {
      session = this.assertActive(await this.provider.signIn(email, password));
    } catch (error) {
      await this.audit("identity.signin", "anonymous", "platform", "failure", traceId);
      throw error;
    }
    await this.audit("identity.signin", session.identity.userId, "platform", "success", traceId, {
      rememberMe,
    });
    return {
      ...session,
      persistence: rememberMe ? "persistent" : "session",
    };
  }

  async refresh(refreshToken: string, traceId = createTraceId()): Promise<ProviderSession> {
    let session: ProviderSession;
    try {
      session = this.assertActive(await this.provider.refresh(refreshToken));
    } catch (error) {
      await this.audit("identity.refresh", "anonymous", "platform", "failure", traceId);
      throw error;
    }
    await this.audit("identity.refresh", session.identity.userId, "platform", "success", traceId);
    return session;
  }

  async verifySession(
    accessToken: string,
    traceId = createTraceId(),
  ): Promise<ProviderSession> {
    let session: ProviderSession;
    try {
      session = this.assertActive(await this.provider.verify(accessToken));
    } catch (error) {
      await this.audit(
        "identity.verification",
        "anonymous",
        "platform",
        "failure",
        traceId,
      );
      throw error;
    }
    await this.audit(
      "identity.verification",
      session.identity.userId,
      "platform",
      "success",
      traceId,
    );
    return session;
  }

  async signOut(accessToken: string, traceId = createTraceId()): Promise<void> {
    let session: ProviderSession;
    try {
      session = await this.provider.verify(accessToken);
      await this.provider.signOut(accessToken);
    } catch (error) {
      await this.audit("identity.signout", "anonymous", "platform", "failure", traceId);
      throw error;
    }
    await this.audit("identity.signout", session.identity.userId, "platform", "success", traceId);
  }

  async requestPasswordReset(
    email: string,
    redirectTo?: string,
    traceId = createTraceId(),
  ): Promise<void> {
    try {
      await this.provider.requestPasswordReset(email, redirectTo);
    } catch (error) {
      await this.audit("identity.password_reset_requested", "anonymous", "platform", "failure", traceId);
      throw error;
    }
    await this.audit("identity.password_reset_requested", "anonymous", "platform", "success", traceId);
  }

  async updatePassword(
    accessToken: string,
    password: string,
    traceId = createTraceId(),
  ): Promise<void> {
    if (password.length < 8) {
      throw new AuthenticationError(
        "Password must contain at least 8 characters.",
      );
    }
    let session: ProviderSession;
    try {
      session = this.assertActive(await this.provider.verify(accessToken));
      await this.provider.updatePassword(accessToken, password);
    } catch (error) {
      await this.audit(
        "identity.password_reset_completed",
        "anonymous",
        "platform",
        "failure",
        traceId,
      );
      throw error;
    }
    await this.audit(
      "identity.password_reset_completed",
      session.identity.userId,
      "platform",
      "success",
      traceId,
    );
  }

  async organizations(accessToken: string): Promise<readonly OrganizationMembership[]> {
    const session = this.assertActive(await this.provider.verify(accessToken));
    return this.memberships.list(session.identity.userId);
  }

  async authorize(input: AuthorizationInput): Promise<AuthorizedRequestContext> {
    const traceId = input.traceId ?? createTraceId();
    const requestId = input.requestId ?? crypto.randomUUID();
    let actorId = "anonymous";

    let providerSession: ProviderSession;
    let session: PlatformSession;
    try {
      providerSession = this.assertActive(
        await this.provider.verify(input.accessToken),
      );
      actorId = providerSession.identity.userId;
      const membership = await this.memberships.get(actorId, input.orgId);
      if (!membership || membership.status !== "active") {
        throw new AuthorizationError(
          "The authenticated user is not an active member of the requested organization.",
        );
      }

      session = {
        userId: actorId,
        orgId: membership.orgId,
        role: membership.role,
      };
      assertPlatformAccess(session, input.orgId, input.action);
    } catch (error) {
      await this.audit(input.action, actorId, input.orgId, "denied", traceId, {
        requestId,
      });
      throw error;
    }
    await this.audit(input.action, actorId, input.orgId, "success", traceId, {
      requestId,
    });

    return {
      identity: providerSession.identity,
      session,
      requestId,
      traceId,
      accessToken: input.accessToken,
    };
  }

  private assertActive(session: ProviderSession): ProviderSession {
    if (Date.parse(session.expiresAt) <= Date.now()) {
      throw new AuthenticationError("The session has expired.");
    }
    return session;
  }

  private async audit(
    action: string,
    actorId: string,
    orgId: string,
    outcome: "success" | "failure" | "denied",
    traceId: string,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    await this.auditSink.record(
      createAuditEvent({
        traceId,
        orgId,
        actorId,
        action,
        resourceType: "identity",
        resourceId: null,
        outcome,
        metadata,
      }),
    );
  }
}

export interface RequestHeaders {
  readonly authorization?: string;
  readonly "x-organization-id"?: string;
  readonly "x-request-id"?: string;
  readonly "x-trace-id"?: string;
}

export async function authorizeRequest(
  runtime: IdentityRuntime,
  headers: RequestHeaders,
  action: PlatformAction,
): Promise<AuthorizedRequestContext> {
  const accessToken = headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const orgId = headers["x-organization-id"];
  if (!accessToken) {
    throw new AuthenticationError("A bearer access token is required.");
  }
  if (!orgId) {
    throw new AuthorizationError("An organization context is required.");
  }
  return runtime.authorize({
    accessToken,
    orgId,
    action,
    requestId: headers["x-request-id"],
    traceId: headers["x-trace-id"],
  });
}
