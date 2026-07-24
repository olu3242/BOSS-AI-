import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  createBrowserIdentityServices,
  readBrowserIdentity,
  safeNextPath,
} from "../../../src/server/auth";
import { CreateOrganizationSchema } from "../../../src/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await readBrowserIdentity();
  if (!session) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url), 303);
  }

  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const next = safeNextPath(String(form.get("next") ?? ""), "/dashboard");

  const validation = CreateOrganizationSchema.safeParse({ name });
  if (!validation.success) {
    const message = validation.error.errors[0]?.message ?? "Invalid organization name.";
    return NextResponse.redirect(
      new URL(`/onboarding/organization?error=${encodeURIComponent(message)}`, request.url),
      303,
    );
  }

  const traceId = randomUUID();
  try {
    const { organizations } = createBrowserIdentityServices();
    await organizations.create(session.identity.userId, validation.data.name, {
      actorId: session.identity.userId,
      requestId: randomUUID(),
      correlationId: traceId,
      traceId,
    });
    return NextResponse.redirect(new URL(next, request.url), 303);
  } catch {
    return NextResponse.redirect(
      new URL(
        `/onboarding/organization?error=${encodeURIComponent("Organization creation failed. Please try again.")}`,
        request.url,
      ),
      303,
    );
  }
}
