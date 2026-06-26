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

export interface Business {
  id: ID;
  orgId: ID;
  name: string;
  industry: string;
  employeeCount: number;
  annualRevenue: number;
}

export * from "./ontology.js";
