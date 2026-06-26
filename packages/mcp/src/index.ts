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
