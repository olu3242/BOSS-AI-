/**
 * Feature flags — environment-variable-driven, no external service required.
 *
 * Flags are read at startup from process.env. Changing a flag requires
 * redeployment (or env var update via Doppler/Vercel). This is sufficient
 * for RC1 — a runtime flag service can be added in RC3 if needed.
 *
 * Usage:
 *   if (flags.isEnabled("ai_workforce")) { ... }
 *
 * Flag env var convention: BOSS_FLAG_<UPPERCASE_FLAG_KEY>=true|false
 * Example: BOSS_FLAG_AI_WORKFORCE=true
 */

export interface FeatureFlagService {
  isEnabled(flag: FeatureFlag): boolean;
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

export function createFeatureFlagService(): FeatureFlagService {
  function isEnabled(flag: FeatureFlag): boolean {
    const envKey = `BOSS_FLAG_${flag.toUpperCase()}`;
    const envValue = process.env[envKey];
    if (envValue === undefined) return FLAG_DEFAULTS[flag];
    return envValue === "true" || envValue === "1";
  }

  return {
    isEnabled,
    getAll() {
      return Object.fromEntries(
        (Object.keys(FLAG_DEFAULTS) as FeatureFlag[]).map((f) => [f, isEnabled(f)])
      ) as Record<FeatureFlag, boolean>;
    },
  };
}
