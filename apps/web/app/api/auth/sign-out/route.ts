import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  clearSessionCookies,
  createBrowserIdentityServices,
} from "../../../../src/server/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  if (accessToken) {
    try {
      const { identity } = createBrowserIdentityServices();
      await identity.signOut(accessToken);
    } catch {
      // Local cookie cleanup must still complete when provider revocation fails.
    }
  }
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  clearSessionCookies(response);
  return response;
}
