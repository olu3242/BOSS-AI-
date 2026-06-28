import { seedEventRegistry } from "./events.js";
import { seedPolicyRegistry } from "./policies.js";
import {
  seedGovernanceRegistry,
  seedLifecycleRegistry,
} from "./governance.js";
import { seedPlatformCatalogs } from "./platformCatalogs.js";
import { seedBusinessRelationshipRegistry } from "../registries/businessRelationship.js";
import { seedSemanticViewRegistry } from "../registries/semanticView.js";
import { seedBusinessQueryRegistry } from "../registries/businessQuery.js";

export { seedEventRegistry } from "./events.js";
export { seedPolicyRegistry } from "./policies.js";
export {
  seedGovernanceRegistry,
  seedLifecycleRegistry,
} from "./governance.js";
export { seedPlatformCatalogs } from "./platformCatalogs.js";

let seeded = false;

/** Seeds every platform-wide (non-pack-specific) registry. Call once at startup. */
export function seedCoreRegistries(): void {
  if (seeded) {
    return;
  }
  seeded = true;
  seedEventRegistry();
  seedPolicyRegistry();
  seedLifecycleRegistry();
  seedGovernanceRegistry();
  seedPlatformCatalogs();
  seedBusinessRelationshipRegistry();
  seedSemanticViewRegistry();
  seedBusinessQueryRegistry();
}
