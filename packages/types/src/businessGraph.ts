import type { ID } from "./primitives.js";

export type CanonicalBusinessNodeType =
  | "organization"
  | "business_unit"
  | "department"
  | "team"
  | "user"
  | "customer"
  | "vendor"
  | "product"
  | "service"
  | "revenue_stream"
  | "project"
  | "task"
  | "document"
  | "workflow"
  | "automation"
  | "ai_agent"
  | "kpi"
  | "objective"
  | "policy"
  | "integration";

export type BusinessNodeType =
  | CanonicalBusinessNodeType
  | `extension:${string}`;

export type CanonicalBusinessRelationshipType =
  | "owns"
  | "manages"
  | "belongs_to"
  | "depends_on"
  | "serves"
  | "produces"
  | "supports"
  | "integrates_with"
  | "executes"
  | "measures"
  | "governed_by";

export type BusinessRelationshipType =
  | CanonicalBusinessRelationshipType
  | `extension:${string}`;

export type BusinessGraphStatus = "draft" | "published" | "archived";

export interface GraphMetadata {
  readonly source: string;
  readonly sourceVersion: number;
  readonly owner?: string;
  readonly extensions: Readonly<Record<string, unknown>>;
}

export interface BusinessNode {
  readonly id: ID;
  readonly orgId: ID;
  readonly graphId: ID;
  readonly type: BusinessNodeType;
  readonly label: string;
  readonly externalRef?: string;
  readonly metadata: GraphMetadata;
}

export interface BusinessRelationship {
  readonly id: BusinessRelationshipType;
  readonly displayName: string;
  readonly description: string;
  readonly inverse?: BusinessRelationshipType;
  readonly version: string;
  readonly status: "active" | "deprecated";
}

export interface BusinessEdge {
  readonly id: ID;
  readonly orgId: ID;
  readonly graphId: ID;
  readonly sourceNodeId: ID;
  readonly targetNodeId: ID;
  readonly relationship: BusinessRelationshipType;
  readonly metadata: GraphMetadata;
}

export interface GraphVersion {
  readonly graphId: ID;
  readonly orgId: ID;
  readonly businessId: ID;
  readonly version: number;
  readonly lockVersion: number;
  readonly status: BusinessGraphStatus;
  readonly sourceDiscoveryVersion: number;
  readonly createdBy: ID;
  readonly createdAt: string;
}

export interface GraphSnapshot extends GraphVersion {
  readonly nodes: readonly BusinessNode[];
  readonly edges: readonly BusinessEdge[];
  readonly metadata: GraphMetadata;
}

export interface BusinessGraphRecord extends GraphVersion {
  readonly updatedAt: string;
}

export interface BusinessGraphHistoryEntry {
  readonly id: ID;
  readonly orgId: ID;
  readonly graphId: ID;
  readonly graphVersion: number;
  readonly action:
    | "created"
    | "node_created"
    | "node_updated"
    | "relationship_created"
    | "relationship_removed"
    | "versioned"
    | "published"
    | "archived";
  readonly actorId: ID;
  readonly reason: string;
  readonly correlationId: string;
  readonly traceId: string;
  readonly occurredAt: string;
}

export interface GraphResolution {
  readonly graphId: ID;
  readonly graphVersion: number;
  readonly node: BusinessNode;
  readonly incoming: readonly BusinessEdge[];
  readonly outgoing: readonly BusinessEdge[];
}
