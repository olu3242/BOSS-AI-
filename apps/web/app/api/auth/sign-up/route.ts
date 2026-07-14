import { NextResponse, type NextRequest } from "next/server";
import { createBrowserIdentityServices, writeSessionCookies } from "../../../../src/server/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/onboarding/organization");
  // Derive callback URL from env var if set, else from the current request origin.
  // The callback URL must be in Supabase's allowed redirect URL list.
  const callbackUrl =
    process.env.BOSS_AUTH_CALLBACK_URL ??
    new URL("/auth/callback", request.url).toString();
  try {
    const { identity } = createBrowserIdentityServices();
    const result = await identity.signUp(email, password, callbackUrl);
    if (!result.session) {
      return NextResponse.redirect(
        new URL(`/auth/verify?email=${encodeURIComponent(email)}`, request.url),
        303,
      );
    }
    const response = NextResponse.redirect(new URL(next, request.url), 303);
    writeSessionCookies(response, result.session, false);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign-up failed.";
    return NextResponse.redirect(
      new URL(`/auth/sign-up?error=${encodeURIComponent(message)}`, request.url),
      303,
    );
  }
}
