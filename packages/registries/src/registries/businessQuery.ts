import type {
  BusinessQueryId,
  QueryDefinition,
  SemanticEntityType,
  SemanticRelationshipType,
} from "@boss/types";
import { createReadonlyRegistry } from "../createReadonlyRegistry.js";

export interface BusinessQueryEntry extends QueryDefinition {
  readonly key: string;
  readonly label: string;
  readonly owner: string;
  readonly documentation: string;
}

export const businessQueryRegistry =
  createReadonlyRegistry<BusinessQueryEntry>();

const allRelationships: readonly SemanticRelationshipType[] = Object.freeze([
  "owns",
  "manages",
  "belongs_to",
  "depends_on",
  "serves",
  "produces",
  "supports",
  "integrates_with",
  "executes",
  "measures",
  "governed_by",
]);

const definition = (
  id: BusinessQueryId,
  displayName: string,
  description: string,
  category: QueryDefinition["category"],
  projectionKind: QueryDefinition["projectionKind"],
  entityTypes: readonly SemanticEntityType[],
  semanticViewId?: QueryDefinition["semanticViewId"],
): QueryDefinition => ({
  id,
  displayName,
  description,
  category,
  projectionKind,
  entityTypes,
  relationshipTypes: allRelationships,
  ...(semanticViewId ? { semanticViewId } : {}),
  version: "1.0.0",
  status: "active",
});

const definitions: readonly QueryDefinition[] = Object.freeze([
  definition("organization_summary", "Organization Summary", "Organization identity, structure, and factual relationships.", "executive", "context", ["organization", "business_unit"], "executive"),
  definition("executive_dashboard", "Executive Dashboard", "Executive semantic entities and aggregate counts.", "executive", "aggregate", ["organization", "business_unit", "department", "objective", "kpi", "revenue_stream", "policy"], "executive"),
  definition("kpi_summary", "KPI Summary", "Known KPI entities and their relationships.", "executive", "kpi", ["kpi"], "executive"),
  definition("department_overview", "Department Overview", "Departments, teams, and organizational relationships.", "operations", "entity", ["department", "team"], "operations"),
  definition("workflow_summary", "Workflow Summary", "Known workflow entities and execution relationships.", "operations", "entity", ["workflow"], "operations"),
  definition("automation_summary", "Automation Summary", "Known automation entities and execution relationships.", "operations", "entity", ["automation"], "automation"),
  definition("customer_portfolio", "Customer Portfolio", "Known customer entities.", "customers", "entity", ["customer"], "sales"),
  definition("customer_relationships", "Customer Relationships", "Relationships connected to known customers.", "customers", "relationship", ["customer"], "customer_success"),
  definition("customer_activity", "Customer Activity", "Factual customer relationship activity represented in context.", "customers", "aggregate", ["customer"], "customer_success"),
  definition("revenue_summary", "Revenue Summary", "Known revenue streams and measures.", "business", "aggregate", ["revenue_stream", "kpi"], "finance"),
  definition("team_summary", "Team Summary", "Known teams and users.", "business", "entity", ["team", "user"], "operations"),
  definition("ai_operations_summary", "AI Operations Summary", "Known AI agents, workflows, automations, and integrations.", "business", "aggregate", ["ai_agent", "workflow", "automation", "integration"], "ai_operations"),
  definition("compliance_summary", "Compliance Summary", "Known policies and governed relationships.", "business", "entity", ["policy"], "finance"),
  definition("execution_context", "Execution Context", "Canonical workflow, automation, and AI execution context.", "platform", "context", ["organization", "business_unit", "workflow", "automation", "ai_agent", "integration", "policy"], "ai_operations"),
]);

export function seedBusinessQueryRegistry(): void {
  for (const query of definitions) {
    businessQueryRegistry.register({
      ...query,
      key: query.id,
      label: query.displayName,
      owner: "Platform",
      documentation: "docs/execution/QUERY_CATALOG.md",
    });
  }
}
