import { NextResponse, type NextRequest } from "next/server";
import {
  clearSessionCookies,
  createBrowserIdentityServices,
  PERSIST_COOKIE,
  REFRESH_COOKIE,
  safeNextPath,
  writeSessionCookies,
} from "../../../../src/server/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const next = safeNextPath(request.nextUrl.searchParams.get("next"), "/dashboard");
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url), 303);
  }
  try {
    const { identity } = createBrowserIdentityServices();
    const session = await identity.refresh(refreshToken);
    const response = NextResponse.redirect(new URL(next, request.url), 303);
    writeSessionCookies(
      response,
      session,
      request.cookies.get(PERSIST_COOKIE)?.value === "1",
    );
    return response;
  } catch {
    const response = NextResponse.redirect(new URL("/auth/sign-in?expired=1", request.url), 303);
    clearSessionCookies(response);
    return response;
  }
}
