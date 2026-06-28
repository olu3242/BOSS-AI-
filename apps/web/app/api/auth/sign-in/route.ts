import { NextResponse, type NextRequest } from "next/server";
import {
  createBrowserIdentityServices,
  safeNextPath,
  writeSessionCookies,
} from "../../../../src/server/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const rememberMe = form.get("rememberMe") === "on";
  const next = safeNextPath(String(form.get("next") ?? ""), "/dashboard");
  try {
    const { identity } = createBrowserIdentityServices();
    const session = await identity.signIn(email, password, rememberMe);
    const response = NextResponse.redirect(new URL(next, request.url), 303);
    writeSessionCookies(response, session, rememberMe);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign-in failed.";
    return NextResponse.redirect(
      new URL(
        `/auth/sign-in?error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}`,
        request.url,
      ),
      303,
    );
  }
}
