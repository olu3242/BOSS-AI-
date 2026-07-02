import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const name = data.get("name")?.toString().trim();
  const email = data.get("email")?.toString().trim().toLowerCase();
  const business = data.get("business")?.toString().trim();
  const industry = data.get("industry")?.toString().trim();
  const employees = data.get("employees")?.toString().trim();

  if (!name || !email || !business || !industry) {
    return NextResponse.redirect(new URL("/waitlist?error=missing_fields", req.url));
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.redirect(new URL("/waitlist?error=invalid_email", req.url));
  }

  // Log the submission (CRM/email integration wired in RC2.3).
  console.log("[waitlist]", JSON.stringify({ name, email, business, industry, employees, submittedAt: new Date().toISOString() }));

  return NextResponse.redirect(new URL("/waitlist/success", req.url));
}
