import type {
  BusinessRelationship,
  BusinessRelationshipType,
} from "@boss/types";
import { createReadonlyRegistry } from "../createReadonlyRegistry.js";

export interface RegisteredBusinessRelationship
  extends BusinessRelationship {
  readonly key: string;
  readonly label: string;
}

export const businessRelationshipRegistry =
  createReadonlyRegistry<RegisteredBusinessRelationship>();

const definitions: readonly BusinessRelationship[] = Object.freeze([
  { id: "owns", displayName: "Owns", description: "Owns or controls the target.", inverse: "belongs_to", version: "1.0.0", status: "active" },
  { id: "manages", displayName: "Manages", description: "Directly manages the target.", version: "1.0.0", status: "active" },
  { id: "belongs_to", displayName: "Belongs To", description: "Belongs to the target.", inverse: "owns", version: "1.0.0", status: "active" },
  { id: "depends_on", displayName: "Depends On", description: "Requires the target.", version: "1.0.0", status: "active" },
  { id: "serves", displayName: "Serves", description: "Provides value to the target.", version: "1.0.0", status: "active" },
  { id: "produces", displayName: "Produces", description: "Produces the target output or offering.", version: "1.0.0", status: "active" },
  { id: "supports", displayName: "Supports", description: "Supports operation of the target.", version: "1.0.0", status: "active" },
  { id: "integrates_with", displayName: "Integrates With", description: "Exchanges data or actions with the target.", version: "1.0.0", status: "active" },
  { id: "executes", displayName: "Executes", description: "Executes the target definition or work.", version: "1.0.0", status: "active" },
  { id: "measures", displayName: "Measures", description: "Measures performance of the target.", version: "1.0.0", status: "active" },
  { id: "governed_by", displayName: "Governed By", description: "Is governed by the target policy.", version: "1.0.0", status: "active" },
]);

export function seedBusinessRelationshipRegistry(): void {
  for (const definition of definitions) {
    businessRelationshipRegistry.register({
      ...definition,
      id: definition.id as BusinessRelationshipType,
      key: definition.id,
      label: definition.displayName,
    });
  }
}
