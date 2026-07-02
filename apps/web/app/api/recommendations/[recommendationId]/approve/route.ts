import { NextRequest, NextResponse } from "next/server";
import { requireActiveTenant } from "../../../../../src/server/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ recommendationId: string }> }
) {
  const { recommendationId } = await params;
  const { organization } = await requireActiveTenant("/dashboard");

  const data = await req.formData();
  const businessId = data.get("businessId")?.toString();

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
  await fetch(`${apiBase}/api/v1/recommendations/${recommendationId}/approve`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-org-id": organization.id },
    body: JSON.stringify({}),
  });

  const redirectTo = businessId
    ? `/business/${businessId}/workspace`
    : "/dashboard";

  return NextResponse.redirect(new URL(redirectTo, req.url));
}
