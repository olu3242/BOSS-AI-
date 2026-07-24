import { NextResponse, type NextRequest } from "next/server";
import {
  createBrowserIdentityServices,
  safeNextPath,
  writeSessionCookies,
} from "../../../../src/server/auth";
import { SignInSchema } from "../../../../src/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const rememberMe = form.get("rememberMe") === "on";
  const next = safeNextPath(String(form.get("next") ?? ""), "/dashboard");

  const validation = SignInSchema.safeParse({ email, password });
  if (!validation.success) {
    const message = validation.error.errors[0]?.message ?? "Invalid input.";
    return NextResponse.redirect(
      new URL(`/auth/sign-in?error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}`, request.url),
      303,
    );
  }

  try {
    const { identity } = createBrowserIdentityServices();
    const session = await identity.signIn(validation.data.email, validation.data.password, rememberMe);
    const response = NextResponse.redirect(new URL(next, request.url), 303);
    writeSessionCookies(response, session, rememberMe);
    return response;
  } catch {
    return NextResponse.redirect(
      new URL(
        `/auth/sign-in?error=${encodeURIComponent("Invalid email or password.")}&next=${encodeURIComponent(next)}`,
        request.url,
      ),
      303,
    );
  }
}
