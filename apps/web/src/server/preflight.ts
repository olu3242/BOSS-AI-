/**
 * Runtime preflight — validates required env vars and connectivity at startup.
 * Logs a structured error and throws so the process exits cleanly rather than
 * letting users hit configuration failures mid-request.
 */

const BLOCKED_HOSTNAMES = ["localhost", "127.0.0.1", "host.docker.internal", "0.0.0.0"];

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
  } else if (isProduction && isLocalhost(databaseUrl)) {
    failures.push(
      `DATABASE_URL points to a local host (${extractHostname(databaseUrl)}) in production. ` +
        "Set it to the Supabase connection pooler URL (port 6543, ?pgbouncer=true).",
    );
  }

  return { passed: failures.length === 0, failures };
}

async function checkDatabaseConnectivity(): Promise<string | null> {
  const connectionString = process.env.DATABASE_URL!;
  let host: string;
  let port: number;
  try {
    const url = new URL(connectionString);
    host = url.hostname;
    port = url.port ? parseInt(url.port, 10) : 5432;
  } catch {
    return `DATABASE_URL is not a valid URL: ${connectionString}`;
  }

  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const net = require("net") as typeof import("net");
    const socket = net.createConnection({ host, port, timeout: 5000 });
    socket.once("connect", () => {
      socket.destroy();
      resolve(null);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(`Connection to ${host}:${port} timed out after 5s.`);
    });
    socket.once("error", (err: Error) => {
      resolve(`Cannot reach ${host}:${port} — ${err.message}`);
    });
  });
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

  // --- Connectivity check ---
  // Only run if DATABASE_URL is set (env check above would have failed otherwise).
  const dbError = await checkDatabaseConnectivity();
  if (dbError) {
    const message =
      `[preflight] Database connectivity check failed: ${dbError}\n` +
      "  Ensure DATABASE_URL is the Supabase connection pooler URL (port 6543, ?pgbouncer=true) " +
      "and the database is accepting connections.";
    if (isProduction) {
      throw new Error(message);
    } else {
      console.error(message);
    }
    return;
  }

  console.log("[preflight] ✓ Environment and database connectivity verified.");
}
