import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  createBrowserIdentityServices,
  readBrowserIdentity,
  safeNextPath,
} from "../../../../src/server/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await readBrowserIdentity();
  if (!session) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url), 303);
  }

  const form = await request.formData();
  const orgId = String(form.get("orgId") ?? "");
  const next = safeNextPath(String(form.get("next") ?? ""), "/dashboard");
  const traceId = randomUUID();

  try {
    const { organizations } = createBrowserIdentityServices();
    await organizations.switch(session.identity.userId, orgId, {
      actorId: session.identity.userId,
      requestId: randomUUID(),
      correlationId: traceId,
      traceId,
    });
    return NextResponse.redirect(new URL(next, request.url), 303);
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard?error=organization-switch", request.url),
      303,
    );
  }
}
