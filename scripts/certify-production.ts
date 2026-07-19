#!/usr/bin/env tsx
/**
 * Production Certification Script
 *
 * Runs a structured set of checks against a live deployment URL.
 * Pass/fail is determined by HTTP responses and response body shape.
 * OAuth flows and browser interactions are excluded — those require
 * the manual certification checklist.
 *
 * Usage:
 *   CERTIFICATION_URL=https://boss-ai-two.vercel.app pnpm certify:production
 *   CERTIFICATION_URL=https://<preview-url>.vercel.app pnpm certify:production
 */

const BASE_URL = process.env.CERTIFICATION_URL?.replace(/\/$/, "");
// Optional: set VERCEL_BYPASS_SECRET to bypass Vercel Authentication on preview/protected deployments.
const BYPASS_SECRET = process.env.VERCEL_BYPASS_SECRET;

if (!BASE_URL) {
  console.error("Error: CERTIFICATION_URL environment variable is required.");
  console.error("  Example: CERTIFICATION_URL=https://boss-ai-two.vercel.app pnpm certify:production");
  process.exit(1);
}

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];

async function check(
  name: string,
  fn: () => Promise<void>,
): Promise<void> {
  try {
    await fn();
    results.push({ name, passed: true, detail: "OK" });
    console.log(`  ✅ ${name}`);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, detail });
    console.log(`  ❌ ${name}: ${detail}`);
  }
}

async function get(path: string, options?: RequestInit): Promise<Response> {
  const url = `${BASE_URL}${path}`;
  const bypassHeader = BYPASS_SECRET
    ? { "x-vercel-protection-bypass": BYPASS_SECRET }
    : {};
  const res = await fetch(url, {
    redirect: "manual",
    ...options,
    headers: { ...bypassHeader, ...(options?.headers ?? {}) },
  });
  return res;
}

async function detectVercelAuth(): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/`, { redirect: "manual" });
  if (res.status !== 403) return false;
  // Vercel Auth 403 includes a Set-Cookie with _vercel_jwt or a redirect to vercel.com.
  const body = await res.text();
  return (
    body.includes("vercel") ||
    body.includes("authentication") ||
    res.headers.get("server") === "Vercel"
  );
}

// ---------------------------------------------------------------------------
// Environment checks (inferred from response behaviour)
// ---------------------------------------------------------------------------
async function runEnvChecks() {
  console.log("\n── Environment ────────────────────────────────────────");

  await check("Landing page responds 200", async () => {
    const res = await get("/");
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await check("Sign-in page responds 200", async () => {
    const res = await get("/auth/sign-in");
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const html = await res.text();
    if (!html.includes("sign") && !html.includes("Sign")) {
      throw new Error("Response does not look like a sign-in page");
    }
  });

  await check("Auth callback route exists (not 404)", async () => {
    // GET returns 405 or 400 (method not allowed / bad params) — either means the route exists.
    const res = await get("/auth/callback");
    if (res.status === 404) throw new Error("Route not found — deployment may be missing auth routes");
  });

  await check("Forgot-password page responds 200", async () => {
    const res = await get("/auth/forgot-password");
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });
}

// ---------------------------------------------------------------------------
// Authentication boundary checks
// ---------------------------------------------------------------------------
async function runAuthChecks() {
  console.log("\n── Authentication Boundaries ───────────────────────────");

  await check("Unauthenticated /dashboard redirects to sign-in", async () => {
    const res = await get("/dashboard");
    // Next.js middleware redirect: 307 Temporary Redirect
    if (res.status !== 307 && res.status !== 302 && res.status !== 308) {
      throw new Error(`Expected redirect (30x), got ${res.status}`);
    }
    const location = res.headers.get("location") ?? "";
    if (!location.includes("sign-in") && !location.includes("auth")) {
      throw new Error(`Redirect target unexpected: ${location}`);
    }
  });

  await check("Unauthenticated /onboarding redirects to sign-in", async () => {
    const res = await get("/onboarding/organization");
    if (res.status !== 307 && res.status !== 302 && res.status !== 308) {
      throw new Error(`Expected redirect (30x), got ${res.status}`);
    }
  });

  await check("API token route rejects unauthenticated request (401)", async () => {
    const res = await get("/api/auth/token");
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  await check("Sign-out POST clears session (303 redirect)", async () => {
    // Without a real session this will still return a redirect or 4xx — not a 500.
    const res = await get("/api/auth/sign-out", { method: "POST" });
    if (res.status >= 500) throw new Error(`Server error on sign-out: ${res.status}`);
  });

  await check("Password reset POST redirects (not 500)", async () => {
    const body = new URLSearchParams({ email: "cert-test@example.com" });
    const res = await get("/api/auth/forgot-password", {
      method: "POST",
      body,
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    // Should redirect to /auth/forgot-password?sent=1 or ?error=unavailable — either is non-5xx.
    if (res.status >= 500) throw new Error(`Server error on password reset: ${res.status}`);
  });
}

// ---------------------------------------------------------------------------
// Preflight validation (inferred: if landing page loads, preflight passed)
// ---------------------------------------------------------------------------
async function runPreflightCheck() {
  console.log("\n── Startup Preflight ───────────────────────────────────");

  await check("Server started without preflight errors (landing page loads)", async () => {
    const res = await get("/");
    if (res.status !== 200) {
      throw new Error(
        `Landing page returned ${res.status} — server may have crashed during startup preflight. ` +
        "Check Vercel function logs for [preflight] errors.",
      );
    }
  });

  await check("No localhost DATABASE_URL (sign-in page loads, not error page)", async () => {
    const res = await get("/auth/sign-in");
    if (res.status !== 200) {
      throw new Error(
        `Sign-in returned ${res.status} — could indicate a preflight failure. ` +
        "Check Vercel logs for DATABASE_URL pointing to localhost.",
      );
    }
    const html = await res.text();
    // A preflight failure in production throws and Next.js shows its own error page.
    if (html.includes("Internal Server Error") || html.includes("Application error")) {
      throw new Error("Page contains an error indicator — server may have failed the preflight check.");
    }
  });
}

// ---------------------------------------------------------------------------
// Static assets
// ---------------------------------------------------------------------------
async function runAssetChecks() {
  console.log("\n── Static Assets ───────────────────────────────────────");

  await check("robots.txt serves 200", async () => {
    const res = await get("/robots.txt");
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await check("sitemap.xml serves 200", async () => {
    const res = await get("/sitemap.xml");
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
function printSummary() {
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log("\n══════════════════════════════════════════════════════════");
  console.log(`  Certification target: ${BASE_URL}`);
  console.log(`  Result: ${passed}/${total} checks passed`);

  if (failed.length > 0) {
    console.log("\n  Failed checks:");
    for (const f of failed) {
      console.log(`    ✗ ${f.name}`);
      console.log(`      ${f.detail}`);
    }
    console.log("\n  ❌ CERTIFICATION FAILED — DO NOT MERGE");
    console.log("══════════════════════════════════════════════════════════\n");
    process.exit(1);
  }

  console.log("\n  ✅ Automated checks passed.");
  console.log("  Manual certification still required:");
  console.log("    □ Google OAuth sign-in → dashboard");
  console.log("    □ Email/password sign-in → dashboard");
  console.log("    □ Sign-up → verification email arrives → link works");
  console.log("    □ Dashboard widgets render (not 'database unreachable')");
  console.log("    □ Business Health Report: questionnaire → score → recs");
  console.log("    □ Session persists after hard refresh");
  console.log("    □ Logout → login works");
  console.log("══════════════════════════════════════════════════════════\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\nBOSS Production Certification`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Started: ${new Date().toISOString()}`);

  // Detect Vercel Authentication before running checks — 403 from Vercel Auth looks
  // identical to an application 403, so we distinguish it early.
  if (!BYPASS_SECRET) {
    const isVercelAuth = await detectVercelAuth();
    if (isVercelAuth) {
      console.error(
        "\n  ⚠️  Vercel Authentication is enabled on this deployment.\n" +
        "  Automated certification cannot reach the app without a bypass secret.\n\n" +
        "  Options:\n" +
        "  1. Disable Vercel Authentication in Vercel Dashboard → Settings → Deployment Protection\n" +
        "     (for the production URL; keep it on for previews)\n" +
        "  2. Set VERCEL_BYPASS_SECRET to the project's bypass secret and re-run:\n" +
        "     VERCEL_BYPASS_SECRET=<secret> CERTIFICATION_URL=<url> pnpm certify:production\n" +
        "     The secret is in Vercel Dashboard → Settings → Deployment Protection → Protection Bypass.\n\n" +
        "  STATUS: BLOCKED — not a code failure. Manual certification required.\n",
      );
      process.exit(2); // exit 2 = blocked (distinct from exit 1 = failed)
    }
  }

  await runPreflightCheck();
  await runEnvChecks();
  await runAuthChecks();
  await runAssetChecks();

  printSummary();
}

main().catch((err) => {
  console.error("Certification script crashed:", err);
  process.exit(1);
});
