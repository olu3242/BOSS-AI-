import { NextResponse, type NextRequest } from "next/server";
import {
  createAuthTraceId,
  createBrowserIdentityServices,
  logAuthPipeline,
  logAuthPipelineFailure,
  writeSessionCookies,
} from "../../../../src/server/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const traceId = request.headers.get("x-boss-auth-trace-id") ?? createAuthTraceId();
  logAuthPipeline(traceId, "OAUTH_SESSION_HANDOFF_RECEIVED");
  try {
    const body = (await request.json()) as {
      accessToken?: string;
      refreshToken?: string;
    };
    if (!body.accessToken || !body.refreshToken) {
      logAuthPipeline(traceId, "OAUTH_SESSION_HANDOFF_REJECTED", {
        reason: "missing_tokens",
      });
      return NextResponse.json(
        { error: "Session tokens are required.", traceId },
        { status: 400 },
      );
    }
    const { identity } = createBrowserIdentityServices();
    logAuthPipeline(traceId, "OAUTH_SESSION_VERIFY_STARTED");
    const verified = await identity.verifySession(body.accessToken, traceId);
    logAuthPipeline(traceId, "OAUTH_SESSION_VERIFIED", {
      userId: verified.identity.userId,
      emailVerified: verified.identity.emailVerified,
    });
    const response = NextResponse.json({ verified: true, traceId });
    writeSessionCookies(
      response,
      { ...verified, refreshToken: body.refreshToken },
      false,
    );
    logAuthPipeline(traceId, "OAUTH_SESSION_COOKIES_WRITTEN", {
      userId: verified.identity.userId,
    });
    return response;
  } catch (error) {
    logAuthPipelineFailure(traceId, "OAUTH_SESSION_HANDOFF_FAILED", error);
    return NextResponse.json(
      { error: "Session verification failed.", traceId },
      { status: 401 },
    );
  }
}
