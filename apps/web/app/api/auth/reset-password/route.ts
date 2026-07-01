import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  clearSessionCookies,
  createBrowserIdentityServices,
} from "../../../../src/server/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const confirmation = String(form.get("confirmation") ?? "");
  if (!accessToken || password !== confirmation || password.length < 8) {
    return NextResponse.redirect(
      new URL("/auth/reset-password?error=invalid", request.url),
      303,
    );
  }

  try {
    const { identity } = createBrowserIdentityServices();
    await identity.updatePassword(accessToken, password);
    await identity.signOut(accessToken);
    const response = NextResponse.redirect(
      new URL("/auth/sign-in?reset=1", request.url),
      303,
    );
    clearSessionCookies(response);
    return response;
  } catch {
    const response = NextResponse.redirect(
      new URL("/auth/reset-password?error=failed", request.url),
      303,
    );
    clearSessionCookies(response);
    return response;
  }
}
