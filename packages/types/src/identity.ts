import type { ID } from "./primitives.js";

export interface Organization {
  readonly id: ID;
  readonly name: string;
  readonly slug: string;
  readonly plan: string;
  readonly status: "active" | "trial" | "suspended";
  readonly createdAt: string;
}

export type OrganizationRole = "owner" | "admin" | "operator" | "viewer";

export interface OrganizationMembershipRecord {
  readonly userId: string;
  readonly orgId: string;
  readonly role: OrganizationRole;
  readonly status: "active" | "suspended";
}

export interface OrganizationWithMembership {
  readonly organization: Organization;
  readonly membership: OrganizationMembershipRecord;
}
