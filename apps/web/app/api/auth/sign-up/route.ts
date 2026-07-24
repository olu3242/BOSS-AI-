import { NextResponse, type NextRequest } from "next/server";
import {
  createBrowserIdentityServices,
  safeNextPath,
  writeSessionCookies,
} from "../../../../src/server/auth";
import { SignUpSchema } from "../../../../src/lib/validation";

export const runtime = "nodejs";

function sanitizeAuthError(error: unknown): string {
  if (!(error instanceof Error)) return "Sign-up failed. Please try again.";
  const msg = error.message.toLowerCase();
  if (msg.includes("email") && (msg.includes("taken") || msg.includes("exist") || msg.includes("registered"))) {
    return "An account with this email already exists.";
  }
  if (msg.includes("password") && msg.includes("weak")) {
    return "Password is too weak. Use at least 8 characters.";
  }
  if (msg.includes("email") && (msg.includes("invalid") || msg.includes("format"))) {
    return "Enter a valid email address.";
  }
  return "Sign-up failed. Please try again.";
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const next = safeNextPath(
    String(form.get("next") ?? ""),
    "/onboarding/organization",
  );

  const validation = SignUpSchema.safeParse({ email, password });
  if (!validation.success) {
    const message = validation.error.errors[0]?.message ?? "Invalid input.";
    return NextResponse.redirect(
      new URL(`/auth/sign-up?error=${encodeURIComponent(message)}`, request.url),
      303,
    );
  }

  try {
    const { identity } = createBrowserIdentityServices();
    const result = await identity.signUp(validation.data.email, validation.data.password);
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
    return NextResponse.redirect(
      new URL(`/auth/sign-up?error=${encodeURIComponent(sanitizeAuthError(error))}`, request.url),
      303,
    );
  }
}
