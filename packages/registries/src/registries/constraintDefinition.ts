import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";
import type { ConstraintCategoryKey } from "./constraintCategory.js";

export type ConstraintSeverity = "critical" | "high" | "medium" | "low" | "informational";
export type ImpactLevel = "low" | "medium" | "high";

/**
 * Declarative, registry-driven detection rules. Each rule is evaluated
 * against the business's MRI responses, derived health dimensions, or
 * capability assessments — no free-form reasoning, every match is
 * traceable back to a specific observed value.
 */
export type ConstraintDetectionRule =
  | { type: "mri_response_equals"; questionKey: string; value: unknown }
  | { type: "mri_response_in"; questionKey: string; values: unknown[] }
  | { type: "mri_response_includes"; questionKey: string; value: unknown }
  | { type: "health_dimension_below"; dimensionKey: string; threshold: number }
  | { type: "capability_maturity_in"; capabilityKey: string; maturities: string[] };

export interface ConstraintImpactModel {
  revenueLossAnnualBase: number;
  timeLostHoursWeekly: number;
  customerImpact: ImpactLevel;
  operationalFriction: ImpactLevel;
  growthLimitation: ImpactLevel;
  ownerStress: ImpactLevel;
}

export interface ConstraintDefinitionEntry extends RegistryEntry {
  definitionKey: string;
  title: string;
  description: string;
  category: ConstraintCategoryKey;
  defaultSeverity: ConstraintSeverity;
  automationPotential: ImpactLevel;
  businessOwner: string;
  /** Any rule matching is sufficient evidence to fire the constraint. */
  detectionRules: ConstraintDetectionRule[];
  impactModel: ConstraintImpactModel;
  relatedCapabilities: string[];
}

export const constraintDefinitionRegistry = createRegistry<ConstraintDefinitionEntry>();
