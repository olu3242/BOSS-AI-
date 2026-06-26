export type ID = string;

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
