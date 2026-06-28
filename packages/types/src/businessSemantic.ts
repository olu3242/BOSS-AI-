import type { ID } from "./primitives.js";

export type SemanticLifecycle = "active" | "historical" | "archived";

export type SemanticEntityType =
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
  | "integration"
  | `extension:${string}`;

export type SemanticRelationshipType =
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
  | "governed_by"
  | `extension:${string}`;

export type SemanticViewId =
  | "executive"
  | "operations"
  | "sales"
  | "marketing"
  | "finance"
  | "customer_success"
  | "ai_operations"
  | "automation"
  | `extension:${string}`;

export interface SemanticEntity {
  readonly id: ID;
  readonly type: SemanticEntityType;
  readonly displayName: string;
  readonly externalRef?: string;
  readonly owner?: string;
  readonly attributes: Readonly<Record<string, unknown>>;
}

export interface SemanticRelationship {
  readonly id: ID;
  readonly sourceEntityId: ID;
  readonly targetEntityId: ID;
  readonly type: SemanticRelationshipType;
  readonly attributes: Readonly<Record<string, unknown>>;
}

export interface BusinessSemanticContext {
  readonly id: ID;
  readonly orgId: ID;
  readonly businessId: ID;
  readonly semanticVersion: number;
  readonly graphVersion: number;
  readonly discoveryVersion: number;
  readonly schemaVersion: string;
  readonly lifecycle: SemanticLifecycle;
  readonly organization: SemanticEntity;
  readonly entities: readonly SemanticEntity[];
  readonly relationships: readonly SemanticRelationship[];
  readonly generatedAt: string;
}

export interface SemanticProjection {
  readonly id: SemanticViewId;
  readonly displayName: string;
  readonly entityTypes: readonly SemanticEntityType[];
  readonly relationshipTypes: readonly SemanticRelationshipType[];
  readonly version: string;
}

export interface SemanticView {
  readonly id: ID;
  readonly viewId: SemanticViewId;
  readonly displayName: string;
  readonly semanticVersion: number;
  readonly graphVersion: number;
  readonly entities: readonly SemanticEntity[];
  readonly relationships: readonly SemanticRelationship[];
  readonly entityCounts: Readonly<Record<string, number>>;
  readonly generatedAt: string;
}

export interface SemanticSnapshot {
  readonly context: BusinessSemanticContext;
  readonly projections: readonly SemanticProjection[];
}

export interface SemanticDependencyResolution {
  readonly entity: SemanticEntity;
  readonly related: readonly SemanticEntity[];
  readonly semanticVersion: number;
  readonly graphVersion: number;
}
