import type { ID } from "./primitives.js";

export * from "./primitives.js";

export interface Organization {
  id: ID;
  name: string;
  slug: string;
  plan: string;
  status: "active" | "trial" | "suspended";
  createdAt: string;
}

export * from "./ontology.js";
