import type { Business } from "@boss/types";

/**
 * MCP (Master Control Platform) — the Brain.
 * Owns all intelligence: knowledge, policies, recommendations.
 * Never executes workflows, authenticates users, or renders UI.
 */
export interface McpQuery {
  business: Business;
  question: string;
}

export interface McpRecommendation {
  summary: string;
  confidence: number;
}

export interface McpClient {
  recommend(query: McpQuery): Promise<McpRecommendation>;
}

export * from "./intelligence/responseMap.js";
export * from "./intelligence/businessDna.js";
export * from "./intelligence/businessHealth.js";
export * from "./intelligence/capabilityGraph.js";
export * from "./intelligence/constraintEngine.js";
export * from "./intelligence/recommendationEngine.js";
export * from "./intelligence/toolFabric.js";
export * from "./intelligence/workflowGenerator.js";
export * from "./intelligence/aiEmployeeRuntime.js";
export * from "./intelligence/multiAgentPlanner.js";
export * from "./intelligence/multiAgentReflection.js";
export * from "./intelligence/claudeInference.js";
export * from "./intelligence/decisionEngine.js";
export * from "./intelligence/scenarioEngine.js";
export * from "./intelligence/executiveBrief.js";
export * from "./intelligence/decisionOptimization.js";
export * from "./intelligence/kpiDerivation.js";
export * from "./intelligence/rootCauseEngine.js";
