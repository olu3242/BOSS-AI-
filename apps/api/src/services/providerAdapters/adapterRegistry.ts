import type { ProviderAdapter } from "./types.js";
import { createTwilioSmsAdapter } from "./twilioSmsAdapter.js";

/**
 * Maps providerKey -> ProviderAdapter. Only providers already defined in
 * @boss/registries' providerDefinitionRegistry may be added here (Goal 16
 * constraint: "do not invent providers"). Any provider without an entry
 * falls back to the existing simulated execution path.
 */
export function createAdapterRegistry(): Map<string, ProviderAdapter> {
  const registry = new Map<string, ProviderAdapter>();
  const twilio = createTwilioSmsAdapter();
  registry.set(twilio.providerKey, twilio);
  return registry;
}
