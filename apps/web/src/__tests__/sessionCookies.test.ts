import { NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";
import type { AuditEvent, ProviderSession } from "@boss/api";
import {
  clearSessionCookies,
  NonBlockingAuditSink,
  sessionCookieSecurity,
  writeSessionCookies,
} from "../server/auth";

const session: ProviderSession = {
  identity: {
    userId: "user-1",
    email: "owner@example.com",
    emailVerified: true,
  },
  accessToken: "access-token",
  refreshToken: "refresh-token",
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
};

describe("browser session cookies", () => {
  it("enables Secure cookies in production", () => {
    expect(sessionCookieSecurity(true)).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
  });

  it("uses HTTP-only same-site session cookies when Remember Me is disabled", () => {
    const response = NextResponse.json({ ok: true });
    writeSessionCookies(response, session, false);
    const header = response.headers.get("set-cookie") ?? "";

    expect(header).toContain("boss_access_token=access-token");
    expect(header).toContain("boss_refresh_token=refresh-token");
    expect(header.match(/HttpOnly/g)).toHaveLength(3);
    expect(header.match(/SameSite=lax/g)).toHaveLength(3);
    expect(header).not.toContain("Max-Age");
  });

  it("persists remembered sessions and expires every cookie on logout", () => {
    const persistent = NextResponse.json({ ok: true });
    writeSessionCookies(persistent, session, true);
    const persistentHeader = persistent.headers.get("set-cookie") ?? "";
    expect(persistentHeader).toContain("Max-Age=");
    expect(persistentHeader).toContain("boss_persistent_session=1");

    const cleared = NextResponse.json({ ok: true });
    clearSessionCookies(cleared);
    const clearedHeader = cleared.headers.get("set-cookie") ?? "";
    expect(clearedHeader.match(/Max-Age=0/g)).toHaveLength(3);
  });
});

describe("auth pipeline audit", () => {
  const event: AuditEvent = {
    id: "event-1",
    traceId: "trace-1",
    orgId: "platform",
    actorId: "user-1",
    action: "identity.verification",
    resourceType: "identity",
    resourceId: null,
    outcome: "success",
    metadata: {},
    occurredAt: new Date().toISOString(),
  };

  it("does not fail authentication when audit persistence is unavailable", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const sink = new NonBlockingAuditSink({
      async record() {
        throw new Error("database unavailable");
      },
    });

    await expect(sink.record(event)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("AUTH_AUDIT_WRITE_FAILED"),
    );

    warn.mockRestore();
  });
});
