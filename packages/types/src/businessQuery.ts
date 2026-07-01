import type { ID } from "./primitives.js";
import type {
  SemanticEntityType,
  SemanticLifecycle,
  SemanticRelationshipType,
  SemanticViewId,
} from "./businessSemantic.js";

export type BusinessQueryId =
  | "organization_summary"
  | "executive_dashboard"
  | "kpi_summary"
  | "department_overview"
  | "workflow_summary"
  | "automation_summary"
  | "customer_portfolio"
  | "customer_relationships"
  | "customer_activity"
  | "revenue_summary"
  | "team_summary"
  | "ai_operations_summary"
  | "compliance_summary"
  | "execution_context"
  | `extension:${string}`;

export type ProjectionKind =
  | "entity"
  | "aggregate"
  | "timeline"
  | "relationship"
  | "kpi"
  | "context";

export interface QueryDefinition {
  readonly id: BusinessQueryId;
  readonly displayName: string;
  readonly description: string;
  readonly category:
    | "executive"
    | "operations"
    | "customers"
    | "business"
    | "platform";
  readonly projectionKind: ProjectionKind;
  readonly semanticViewId?: SemanticViewId;
  readonly entityTypes: readonly SemanticEntityType[];
  readonly relationshipTypes: readonly SemanticRelationshipType[];
  readonly version: string;
  readonly status: "active" | "deprecated";
}

export interface BusinessQuery {
  readonly queryId: BusinessQueryId;
  readonly orgId: ID;
  readonly businessId: ID;
  readonly graphVersion?: number;
  readonly cursor?: string;
  readonly limit?: number;
  readonly parameters?: Readonly<Record<string, string | number | boolean>>;
}

export interface BusinessProjectionItem {
  readonly id: ID;
  readonly kind: "entity" | "relationship" | "aggregate";
  readonly data: Readonly<Record<string, unknown>>;
  readonly evidenceRefs: readonly ID[];
}

export interface BusinessProjection {
  readonly id: ID;
  readonly queryId: BusinessQueryId;
  readonly kind: ProjectionKind;
  readonly items: readonly BusinessProjectionItem[];
  readonly totalCount: number;
  readonly cursor: string | null;
  readonly nextCursor: string | null;
  readonly generatedAt: string;
}

export interface BusinessView {
  readonly id: ID;
  readonly queryId: BusinessQueryId;
  readonly displayName: string;
  readonly semanticVersion: number;
  readonly graphVersion: number;
  readonly lifecycle: SemanticLifecycle;
  readonly projections: readonly BusinessProjection[];
  readonly generatedAt: string;
}

export type BusinessInsightType =
  | "entity_count"
  | "relationship_total"
  | "missing_information"
  | "lifecycle_state"
  | "context_completeness"
  | "execution_statistic";

export interface BusinessInsight {
  readonly id: ID;
  readonly type: BusinessInsightType;
  readonly statement: string;
  readonly value: string | number | boolean | readonly string[];
  readonly evidenceRefs: readonly ID[];
  readonly generatedAt: string;
}

export interface QueryExecution {
  readonly id: ID;
  readonly queryId: BusinessQueryId;
  readonly queryVersion: string;
  readonly semanticVersion: number;
  readonly graphVersion: number;
  readonly discoveryVersion: number;
  readonly cacheHit: boolean;
  readonly durationMs: number;
  readonly projectionDurationMs: number;
  readonly executedAt: string;
}

export interface QueryResult {
  readonly query: BusinessQuery;
  readonly definition: QueryDefinition;
  readonly view: BusinessView;
  readonly insights: readonly BusinessInsight[];
  readonly execution: QueryExecution;
}

export interface BqilPerformance {
  readonly executions: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly cacheHitRatio: number;
  readonly averageQueryLatencyMs: number;
  readonly averageProjectionGenerationMs: number;
  readonly queryCacheEntries: number;
  readonly projectionCacheEntries: number;
  readonly contextCacheEntries: number;
}
