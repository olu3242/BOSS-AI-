/**
 * Feature flags — DB-backed with env-var fallback.
 *
 * Resolution order: DB row (org-scoped) → DB row (global) → env var → default.
 * Falls back gracefully to env-only when DB is unavailable.
 *
 * Flag env var convention: BOSS_FLAG_<UPPERCASE_FLAG_KEY>=true|false
 * Example: BOSS_FLAG_AI_WORKFORCE=true
 */
import { query } from "@boss/db";

export interface FeatureFlagService {
  isEnabled(flag: FeatureFlag, orgId?: string): Promise<boolean>;
  isEnabledSync(flag: FeatureFlag): boolean;
  getAll(): Record<FeatureFlag, boolean>;
}

export type FeatureFlag =
  | "ai_workforce"        // AI employee personas (RC3)
  | "marketplace"         // Industry pack browser (RC3)
  | "multi_agent"         // Multi-agent task delegation
  | "scenario_simulation" // Scenario comparison and forecasting
  | "operating_loop"      // Autonomous operating loop trigger
  | "beta_onboarding"     // Invite-only beta flag
  | "executive_briefs";   // Claude-powered executive briefs

const FLAG_DEFAULTS: Record<FeatureFlag, boolean> = {
  ai_workforce: false,
  marketplace: false,
  multi_agent: true,
  scenario_simulation: true,
  operating_loop: true,
  beta_onboarding: false,
  executive_briefs: true,
};

function fromEnv(flag: FeatureFlag): boolean | undefined {
  const envKey = `BOSS_FLAG_${flag.toUpperCase()}`;
  const envValue = process.env[envKey];
  if (envValue === undefined) return undefined;
  return envValue === "true" || envValue === "1";
}

export function createFeatureFlagService(): FeatureFlagService {
  function isEnabledSync(flag: FeatureFlag): boolean {
    const env = fromEnv(flag);
    return env !== undefined ? env : FLAG_DEFAULTS[flag];
  }

  async function isEnabled(flag: FeatureFlag, orgId?: string): Promise<boolean> {
    try {
      if (orgId) {
        const rows = await query<{ enabled: boolean }>(
          `SELECT enabled FROM feature_flags WHERE flag_key = $1 AND org_id = $2 AND deleted_at IS NULL LIMIT 1`,
          [flag, orgId]
        );
        if (rows[0]) return rows[0].enabled;
      }
      const rows = await query<{ enabled: boolean }>(
        `SELECT enabled FROM feature_flags WHERE flag_key = $1 AND org_id IS NULL AND deleted_at IS NULL LIMIT 1`,
        [flag]
      );
      if (rows[0]) return rows[0].enabled;
    } catch {
      // DB unavailable — fall through to env/default
    }
    return isEnabledSync(flag);
  }

  return {
    isEnabled,
    isEnabledSync,
    getAll() {
      return Object.fromEntries(
        (Object.keys(FLAG_DEFAULTS) as FeatureFlag[]).map((f) => [f, isEnabledSync(f)])
      ) as Record<FeatureFlag, boolean>;
    },
  };
}
