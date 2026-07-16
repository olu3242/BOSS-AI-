/**
 * Runtime preflight — validates required env vars and connectivity at startup.
 * Delegates all validation to @boss/config; logs a structured error and throws
 * so the process exits cleanly rather than letting users hit failures mid-request.
 */

import { ConfigError, getConfig, getConfigDiagnostics } from "@boss/config";

export async function runPreflight(): Promise<void> {
  const isProduction = process.env.NODE_ENV === "production";

  try {
    getConfig(); // throws ConfigError on any invalid / missing env var
  } catch (err) {
    if (err instanceof ConfigError) {
      const message = `[preflight] Environment configuration error: ${err.message}`;
      if (isProduction) {
        throw new Error(message);
      } else {
        console.error(message);
        return;
      }
    }
    throw err;
  }

  const diag = getConfigDiagnostics();
  console.log("[preflight] ✓ Environment configuration verified.", JSON.stringify(diag));
}
