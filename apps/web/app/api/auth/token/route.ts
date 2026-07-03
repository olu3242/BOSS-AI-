import { NextResponse } from "next/server";
import { requireActiveTenant } from "../../../../src/server/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

/**
 * Exchanges the user's session cookie for a BOSS JWT containing the real
 * org_id. Called by the browser-side apiClient when no static token is set.
 * Replaces the DEMO_ORG_ID dev-token shortcut with real tenant resolution.
 */
export async function GET() {
  try {
    const { organization } = await requireActiveTenant("/auth/sign-in");

    const res = await fetch(`${API_BASE_URL}/api/v1/auth/dev-token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orgId: organization.id }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to mint token" }, { status: 502 });
    }

    const { token } = (await res.json()) as { token: string };
    return NextResponse.json({ token, orgId: organization.id });
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}
