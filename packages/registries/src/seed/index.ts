import { seedEventRegistry } from "./events.js";
import { seedPolicyRegistry } from "./policies.js";

export { seedEventRegistry } from "./events.js";
export { seedPolicyRegistry } from "./policies.js";

/** Seeds every platform-wide (non-pack-specific) registry. Call once at startup. */
export function seedCoreRegistries(): void {
  seedEventRegistry();
  seedPolicyRegistry();
}
