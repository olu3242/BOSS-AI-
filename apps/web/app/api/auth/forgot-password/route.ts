import { NextResponse, type NextRequest } from "next/server";
import { createBrowserIdentityServices } from "../../../../src/server/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const callbackUrl =
    process.env.BOSS_PASSWORD_RESET_URL ??
    new URL("/auth/callback", request.url).toString();

  try {
    const { identity } = createBrowserIdentityServices();
    await identity.requestPasswordReset(email, callbackUrl);
    return NextResponse.redirect(
      new URL("/auth/forgot-password?sent=1", request.url),
      303,
    );
  } catch {
    return NextResponse.redirect(
      new URL("/auth/forgot-password?error=unavailable", request.url),
      303,
    );
  }
}
