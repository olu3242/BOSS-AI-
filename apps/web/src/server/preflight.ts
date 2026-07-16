/**
 * Runtime preflight — validates required env vars and connectivity at startup.
 * Logs a structured error and throws so the process exits cleanly rather than
 * letting users hit configuration failures mid-request.
 */

const BLOCKED_HOSTNAMES = ["localhost", "127.0.0.1", "host.docker.internal", "0.0.0.0"];
// Bare words that pg-connection-string silently treats as hostnames — always config errors.
const PLACEHOLDER_HOSTNAMES = new Set(["base", "placeholder", "example", "change-me", "undefined", "null"]);

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function isLocalhost(url: string): boolean {
  const host = extractHostname(url);
  return BLOCKED_HOSTNAMES.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
}

interface PreflightResult {
  passed: boolean;
  failures: string[];
}

function checkEnv(): PreflightResult {
  const failures: string[] = [];
  const isProduction = process.env.NODE_ENV === "production";

  // --- Supabase ---
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl) {
    failures.push("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) is not set.");
  } else if (isProduction && isLocalhost(supabaseUrl)) {
    failures.push(`SUPABASE_URL points to a local host (${extractHostname(supabaseUrl)}) in production.`);
  }

  const anonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!anonKey) {
    failures.push("SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) is not set.");
  }

  // Service role key is required for sign-out and password reset.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    if (isProduction) {
      failures.push("SUPABASE_SERVICE_ROLE_KEY is not set. Sign-out and password reset will fail.");
    } else {
      console.warn("[preflight] SUPABASE_SERVICE_ROLE_KEY is not set — sign-out and password reset disabled.");
    }
  }

  // --- Database ---
  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (!databaseUrl) {
    failures.push("DATABASE_URL is not set. Organization lookup and all Postgres queries will fail.");
  } else {
    // extractHostname falls back to the raw string when URL parsing fails (e.g. DATABASE_URL=base).
    const host = extractHostname(databaseUrl).toLowerCase();
    if (PLACEHOLDER_HOSTNAMES.has(host)) {
      failures.push(
        `DATABASE_URL resolves to placeholder hostname "${host}". ` +
          "Set it to the Supabase Transaction Pooler URL " +
          "(Supabase Dashboard → Project Settings → Database → Transaction mode, port 6543).",
      );
    } else if (isProduction && isLocalhost(databaseUrl)) {
      failures.push(
        `DATABASE_URL points to a local host (${extractHostname(databaseUrl)}) in production. ` +
          "Set it to the Supabase connection pooler URL (port 6543, ?pgbouncer=true).",
      );
    }
  }

  return { passed: failures.length === 0, failures };
}

function checkDatabaseUrl(): string | null {
  const connectionString = process.env.DATABASE_URL!;
  try {
    const url = new URL(connectionString);
    const host = url.hostname;
    const port = url.port || "5432";
    // Validate the URL is parseable and has a host.
    if (!host) return `DATABASE_URL has no hostname.`;
    return null;
  } catch {
    return `DATABASE_URL is not a valid URL: "${connectionString}"`;
  }
}

export async function runPreflight(): Promise<void> {
  const isProduction = process.env.NODE_ENV === "production";

  // --- Env var check ---
  const { passed, failures } = checkEnv();
  if (!passed) {
    const lines = failures.map((f) => `  ✗ ${f}`).join("\n");
    const message = `[preflight] Environment configuration errors:\n${lines}`;
    if (isProduction) {
      // In production, a misconfigured server should not serve requests.
      throw new Error(message);
    } else {
      // In development, log and continue so the dev server stays up.
      console.error(message);
      return;
    }
  }

  // --- DATABASE_URL format check ---
  // Only run if DATABASE_URL passed the env check above.
  if (process.env.DATABASE_URL) {
    const urlError = checkDatabaseUrl();
    if (urlError) {
      const message = `[preflight] DATABASE_URL format error: ${urlError}`;
      if (isProduction) {
        throw new Error(message);
      } else {
        console.error(message);
        return;
      }
    }
  }

  console.log("[preflight] ✓ Environment configuration verified.");
}
