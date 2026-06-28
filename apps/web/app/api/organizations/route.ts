import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  createBrowserIdentityServices,
  readBrowserIdentity,
  safeNextPath,
} from "../../../src/server/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await readBrowserIdentity();
  if (!session) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url), 303);
  }

  const form = await request.formData();
  const name = String(form.get("name") ?? "");
  const next = safeNextPath(String(form.get("next") ?? ""), "/dashboard");
  const traceId = randomUUID();

  try {
    const { organizations } = createBrowserIdentityServices();
    await organizations.create(session.identity.userId, name, {
      actorId: session.identity.userId,
      requestId: randomUUID(),
      correlationId: traceId,
      traceId,
    });
    return NextResponse.redirect(new URL(next, request.url), 303);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Organization creation failed.";
    return NextResponse.redirect(
      new URL(
        `/onboarding/organization?error=${encodeURIComponent(message)}`,
        request.url,
      ),
      303,
    );
  }
}
