import {
  createTraceId,
  IdentityRuntime,
  PostgresAuditSink,
  SessionVerificationError,
  SupabaseIdentityProvider,
  createPostgresOrganizationRuntime,
  type AuditEvent,
  type AuditSink,
  type Identity,
  type ProviderSession,
} from "@boss/api";
import type { Organization, OrganizationWithMembership } from "@boss/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  PERSIST_COOKIE,
  REFRESH_COOKIE,
} from "../authConstants";

export { ACCESS_COOKIE, PERSIST_COOKIE, REFRESH_COOKIE };

function authLog(
  level: "info" | "warn" | "error",
  traceId: string,
  stage: string,
  context: Record<string, unknown> = {},
): void {
  const payload = {
    level,
    traceId,
    stage,
    context,
    occurredAt: new Date().toISOString(),
  };
  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.info(line);
}

export function logAuthPipeline(
  traceId: string,
  stage: string,
  context: Record<string, unknown> = {},
): void {
  authLog("info", traceId, stage, context);
}

export function logAuthPipelineFailure(
  traceId: string,
  stage: string,
  error: unknown,
  context: Record<string, unknown> = {},
): void {
  authLog("error", traceId, stage, {
    ...context,
    error: error instanceof Error ? error.message : String(error),
  });
}

export class NonBlockingAuditSink implements AuditSink {
  constructor(private readonly sink: AuditSink) {}

  async record(event: AuditEvent): Promise<void> {
    try {
      await this.sink.record(event);
    } catch (error) {
      authLog("warn", event.traceId, "AUTH_AUDIT_WRITE_FAILED", {
        action: event.action,
        outcome: event.outcome,
        actorId: event.actorId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

function initializeBrowserIdentityServices() {
console.log("auth.ts process.env", {
  SUPABASE_URL: JSON.stringify(process.env.SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_URL: JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL),
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "[present]" : "[missing]",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "[present]" : "[missing]",
});

const provider = SupabaseIdentityProvider.fromEnvironment();  const { organizations, memberships } = createPostgresOrganizationRuntime();
  const identity = new IdentityRuntime(
    provider,
    memberships,
    new NonBlockingAuditSink(new PostgresAuditSink()),
  );
  return { provider, identity, organizations };
}

type BrowserIdentityServices = ReturnType<typeof initializeBrowserIdentityServices>;

let browserIdentityServices: BrowserIdentityServices | undefined;

export function createBrowserIdentityServices(): BrowserIdentityServices {
  browserIdentityServices ??= initializeBrowserIdentityServices();
  return browserIdentityServices;
}

export function createAuthTraceId(): string {
  return createTraceId();
}

export function sessionCookieSecurity(
  production = process.env.NODE_ENV === "production",
): {
  readonly httpOnly: true;
  readonly sameSite: "lax";
  readonly secure: boolean;
  readonly path: "/";
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: production,
    path: "/",
  };
}

export function writeSessionCookies(
  response: NextResponse,
  session: ProviderSession,
  persistent: boolean,
): void {
  const base = sessionCookieSecurity();
  const accessMaxAge = Math.max(
    1,
    Math.floor((Date.parse(session.expiresAt) - Date.now()) / 1_000),
  );
  response.cookies.set(ACCESS_COOKIE, session.accessToken, {
    ...base,
    ...(persistent ? { maxAge: accessMaxAge } : {}),
  });
  response.cookies.set(REFRESH_COOKIE, session.refreshToken, {
    ...base,
    ...(persistent ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });
  response.cookies.set(PERSIST_COOKIE, persistent ? "1" : "0", {
    ...base,
    ...(persistent ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });
}

export function clearSessionCookies(response: NextResponse): void {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, PERSIST_COOKIE]) {
    response.cookies.set(name, "", {
      ...sessionCookieSecurity(),
      maxAge: 0,
    });
  }
}

export async function readBrowserIdentity(): Promise<{
  readonly identity: Identity;
  readonly accessToken: string;
} | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return null;
  }
  try {
    const { provider } = createBrowserIdentityServices();
    const session = await provider.verify(accessToken);
    return { identity: session.identity, accessToken };
  } catch (err) {
    if (!(err instanceof SessionVerificationError)) {
      throw err;
    }
    authLog("warn", createTraceId(), "AUTH_SESSION_REJECTED", {
      reason: err.message,
    });
    return null;
  }
}

export async function requireBrowserIdentity(
  nextPath: string,
): Promise<{ readonly identity: Identity; readonly accessToken: string }> {
  const session = await readBrowserIdentity();
  if (session) {
    return session;
  }
  const cookieStore = await cookies();
  if (cookieStore.get(REFRESH_COOKIE)?.value) {
    redirect(`/api/auth/refresh?next=${encodeURIComponent(nextPath)}`);
  }
  redirect(`/auth/sign-in?next=${encodeURIComponent(nextPath)}`);
}

export async function requireActiveTenant(nextPath: string): Promise<{
  readonly identity: Identity;
  readonly accessToken: string;
  readonly organization: Organization;
  readonly organizations: readonly OrganizationWithMembership[];
}> {
  const session = await requireBrowserIdentity(nextPath);
  const { organizations } = createBrowserIdentityServices();
  const [active, available] = await Promise.all([
    organizations.active(session.identity.userId),
    organizations.list(session.identity.userId),
  ]);
  if (!active) {
    redirect("/onboarding/organization");
  }
  return {
    ...session,
    organization: active,
    organizations: available,
  };
}

export function safeNextPath(value: string | null, fallback: string): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
