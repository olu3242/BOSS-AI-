import type { RegistryEntry } from "../types.js";
import { createRegistry } from "../createRegistry.js";

export type MriSectionKey =
  | "identity"
  | "customers"
  | "sales"
  | "operations"
  | "finance"
  | "marketing"
  | "technology"
  | "goals"
  | "pain_points";

export interface MriSectionEntry extends RegistryEntry {
  sectionKey: MriSectionKey;
  label: string;
  order: number;
}

export type MriQuestionType =
  | "text"
  | "number"
  | "boolean"
  | "single_select"
  | "multi_select"
  | "scale";

export interface MriQuestionEntry extends RegistryEntry {
  sectionKey: MriSectionKey;
  label: string;
  type: MriQuestionType;
  options?: string[];
  required: boolean;
  order: number;
}

export const mriSectionRegistry = createRegistry<MriSectionEntry>();
export const mriQuestionRegistry = createRegistry<MriQuestionEntry>();
