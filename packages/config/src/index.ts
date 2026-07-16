/**
 * @boss/config — canonical runtime configuration package.
 *
 * ALL other packages and apps import environment values from here.
 * Direct process.env reads are prohibited outside this file.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface DatabaseConfig {
  readonly url: string;
  readonly host: string;
  readonly port: number;
  readonly isLocal: boolean;
}

export interface SupabaseConfig {
  readonly url: string;
  readonly anonKey: string;
  readonly serviceRoleKey: string | undefined;
}

export interface AuthConfig {
  readonly callbackUrl: string;
  readonly passwordResetUrl: string;
}

export interface ApiConfig {
  readonly baseUrl: string;
  readonly staticToken: string | undefined;
}

export interface BossConfig {
  readonly database: DatabaseConfig;
  readonly supabase: SupabaseConfig;
  readonly auth: AuthConfig;
  readonly api: ApiConfig;
  readonly isProduction: boolean;
  readonly isDemoMode: boolean;
}

// ── Validation helpers ───────────────────────────────────────────────────────

const LOCAL_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "host.docker.internal",
  "0.0.0.0",
]);

const PLACEHOLDER_HOSTNAMES = new Set([
  "base",
  "placeholder",
  "example",
  "change-me",
  "undefined",
  "null",
]);

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    // Bare words (e.g. DATABASE_URL=base) fail URL parsing.
    // Treat the raw string as the hostname for diagnostics.
    return url.trim();
  }
}

function isLocal(url: string): boolean {
  const host = extractHostname(url);
  return LOCAL_HOSTNAMES.has(host) || LOCAL_HOSTNAMES.has(host.split(".")[0] ?? "");
}

function isPlaceholder(url: string): boolean {
  const host = extractHostname(url).toLowerCase();
  return PLACEHOLDER_HOSTNAMES.has(host);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ConfigError(`Required environment variable ${name} is not set.`, name);
  }
  return value;
}

function coalesce(...names: string[]): string | undefined {
  for (const name of names) {
    const val = process.env[name];
    if (val) return val;
  }
  return undefined;
}

function requireCoalesce(primary: string, ...fallbacks: string[]): string {
  const val = coalesce(primary, ...fallbacks);
  if (!val) {
    const names = [primary, ...fallbacks].join(" or ");
    throw new ConfigError(`${names} is not set.`, primary);
  }
  return val;
}

// ── Error type ───────────────────────────────────────────────────────────────

export class ConfigError extends Error {
  readonly envVar: string;
  constructor(message: string, envVar: string) {
    super(`[config] ${message}`);
    this.name = "ConfigError";
    this.envVar = envVar;
  }
}

// ── Validation ───────────────────────────────────────────────────────────────

function validateDatabaseUrl(url: string, isProduction: boolean): void {
  if (!url) {
    throw new ConfigError(
      "DATABASE_URL is not set. Set it to the Supabase Transaction Pooler URL (port 6543, ?pgbouncer=true).",
      "DATABASE_URL",
    );
  }

  const host = extractHostname(url);

  if (!host) {
    throw new ConfigError(
      `DATABASE_URL has no hostname. Value starts with: "${url.slice(0, 40)}".`,
      "DATABASE_URL",
    );
  }

  if (PLACEHOLDER_HOSTNAMES.has(host.toLowerCase())) {
    throw new ConfigError(
      `DATABASE_URL resolves to placeholder hostname "${host}". ` +
        "Set it to the Supabase Transaction Pooler URL " +
        "(Supabase Dashboard → Project Settings → Database → Transaction mode, port 6543).",
      "DATABASE_URL",
    );
  }

  if (isProduction && isLocal(url)) {
    throw new ConfigError(
      `DATABASE_URL points to local host "${host}" in a production environment. ` +
        "Set it to the Supabase Transaction Pooler URL (port 6543, ?pgbouncer=true).",
      "DATABASE_URL",
    );
  }
}

function validateSupabaseUrl(url: string, isProduction: boolean): void {
  if (isProduction && isLocal(url)) {
    throw new ConfigError(
      `SUPABASE_URL points to a local host (${extractHostname(url)}) in production.`,
      "SUPABASE_URL",
    );
  }
  if (isPlaceholder(url)) {
    throw new ConfigError(
      `SUPABASE_URL resolves to placeholder hostname "${extractHostname(url)}".`,
      "SUPABASE_URL",
    );
  }
}

// ── Loaders ──────────────────────────────────────────────────────────────────

function loadDatabaseConfig(isProduction: boolean): DatabaseConfig {
  const url =
    process.env["DATABASE_URL"] ??
    (isProduction ? "" : "postgresql://postgres:postgres@localhost:5432/boss_dev");

  validateDatabaseUrl(url, isProduction);

  let host: string;
  let port: number;
  try {
    const parsed = new URL(url);
    host = parsed.hostname;
    port = parsed.port ? parseInt(parsed.port, 10) : 5432;
  } catch {
    host = url;
    port = 5432;
  }

  return Object.freeze({
    url,
    host,
    port,
    isLocal: isLocal(url),
  });
}

function loadSupabaseConfig(isProduction: boolean): SupabaseConfig {
  const url = requireCoalesce("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
  validateSupabaseUrl(url, isProduction);

  const anonKey = requireCoalesce("SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!serviceRoleKey && isProduction) {
    throw new ConfigError(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Sign-out and password reset will fail in production.",
      "SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return Object.freeze({ url, anonKey, serviceRoleKey });
}

function loadAuthConfig(): AuthConfig {
  return Object.freeze({
    callbackUrl:
      process.env["BOSS_AUTH_CALLBACK_URL"] ?? "http://localhost:3000/auth/callback",
    passwordResetUrl:
      process.env["BOSS_PASSWORD_RESET_URL"] ?? "http://localhost:3000/auth/reset-password",
  });
}

function loadApiConfig(): ApiConfig {
  return Object.freeze({
    baseUrl:
      process.env["NEXT_PUBLIC_API_BASE_URL"] ??
      process.env["API_BASE_URL"] ??
      "http://localhost:4000",
    staticToken: process.env["NEXT_PUBLIC_STATIC_TOKEN"] || undefined,
  });
}

// ── Boot diagnostics ─────────────────────────────────────────────────────────

export interface ConfigDiagnostics {
  readonly database: { host: string; port: number; ssl: boolean; isLocal: boolean };
  readonly supabase: { host: string; anonKeyPresent: boolean; serviceRoleKeyPresent: boolean };
  readonly api: { baseUrl: string; staticTokenPresent: boolean };
  readonly isProduction: boolean;
  readonly isDemoMode: boolean;
}

// ── Singleton ────────────────────────────────────────────────────────────────

let _config: BossConfig | undefined;

/**
 * Returns the validated, frozen runtime configuration.
 * Throws `ConfigError` on first call if any required variable is missing or invalid.
 * Subsequent calls return the cached singleton.
 */
export function getConfig(): BossConfig {
  if (_config) return _config;

  const isProduction = process.env["NODE_ENV"] === "production";
  const isDemoMode = process.env["BOSS_WEB_DEMO"] === "true";

  const database = loadDatabaseConfig(isProduction);
  const supabase = loadSupabaseConfig(isProduction);
  const auth = loadAuthConfig();
  const api = loadApiConfig();

  _config = Object.freeze({ database, supabase, auth, api, isProduction, isDemoMode });
  return _config;
}

/**
 * Returns sanitized diagnostics safe to log at startup (no secrets).
 */
export function getConfigDiagnostics(): ConfigDiagnostics {
  const cfg = getConfig();
  return Object.freeze({
    database: {
      host: cfg.database.host,
      port: cfg.database.port,
      ssl: !cfg.database.isLocal,
      isLocal: cfg.database.isLocal,
    },
    supabase: {
      host: extractHostname(cfg.supabase.url),
      anonKeyPresent: cfg.supabase.anonKey.length > 0,
      serviceRoleKeyPresent: !!cfg.supabase.serviceRoleKey,
    },
    api: {
      baseUrl: cfg.api.baseUrl,
      staticTokenPresent: !!cfg.api.staticToken,
    },
    isProduction: cfg.isProduction,
    isDemoMode: cfg.isDemoMode,
  });
}

// Named sub-config accessors — convenience for packages that only need one slice.
export const getDatabaseConfig = (): DatabaseConfig => getConfig().database;
export const getSupabaseConfig = (): SupabaseConfig => getConfig().supabase;
export const getAuthConfig = (): AuthConfig => getConfig().auth;
export const getApiConfig = (): ApiConfig => getConfig().api;

// Reset singleton — test use only.
export function _resetConfigForTest(): void {
  _config = undefined;
}
