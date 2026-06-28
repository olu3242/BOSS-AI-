import type {
  SemanticEntityType,
  SemanticProjection,
  SemanticRelationshipType,
  SemanticViewId,
} from "@boss/types";
import { createReadonlyRegistry } from "../createReadonlyRegistry.js";

export interface SemanticViewEntry extends SemanticProjection {
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly owner: string;
  readonly status: "active" | "deprecated";
}

export const semanticViewRegistry = createReadonlyRegistry<SemanticViewEntry>();

const relationshipTypes: readonly SemanticRelationshipType[] = Object.freeze([
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

const definitions: readonly {
  id: SemanticViewId;
  displayName: string;
  description: string;
  entityTypes: readonly SemanticEntityType[];
}[] = Object.freeze([
  {
    id: "executive",
    displayName: "Executive View",
    description: "Organization, objectives, performance, revenue, and governance.",
    entityTypes: ["organization", "business_unit", "department", "objective", "kpi", "revenue_stream", "policy"],
  },
  {
    id: "operations",
    displayName: "Operations View",
    description: "Operating structure, delivery work, workflows, and automation.",
    entityTypes: ["organization", "business_unit", "department", "team", "project", "task", "workflow", "automation", "kpi"],
  },
  {
    id: "sales",
    displayName: "Sales View",
    description: "Customers, offerings, revenue streams, and sales objectives.",
    entityTypes: ["organization", "business_unit", "customer", "product", "service", "revenue_stream", "objective", "kpi"],
  },
  {
    id: "marketing",
    displayName: "Marketing View",
    description: "Customers, offerings, objectives, and performance measures.",
    entityTypes: ["organization", "business_unit", "customer", "product", "service", "objective", "kpi"],
  },
  {
    id: "finance",
    displayName: "Finance View",
    description: "Revenue streams, measures, objectives, and policies.",
    entityTypes: ["organization", "business_unit", "revenue_stream", "kpi", "objective", "policy"],
  },
  {
    id: "customer_success",
    displayName: "Customer Success View",
    description: "Customers, service teams, offerings, and success measures.",
    entityTypes: ["organization", "business_unit", "customer", "team", "product", "service", "kpi"],
  },
  {
    id: "ai_operations",
    displayName: "AI Operations View",
    description: "AI agents and their execution, workflow, integration, and policy scope.",
    entityTypes: ["organization", "business_unit", "ai_agent", "workflow", "automation", "integration", "policy"],
  },
  {
    id: "automation",
    displayName: "Automation View",
    description: "Automations, workflows, tasks, integrations, and AI agents.",
    entityTypes: ["organization", "business_unit", "automation", "workflow", "task", "integration", "ai_agent"],
  },
]);

export function seedSemanticViewRegistry(): void {
  for (const definition of definitions) {
    semanticViewRegistry.register({
      ...definition,
      key: definition.id,
      label: definition.displayName,
      relationshipTypes,
      version: "1.0.0",
      owner: "Platform",
      status: "active",
    });
  }
}
