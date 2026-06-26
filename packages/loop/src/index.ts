import type { ID } from "@boss/types";

/**
 * Loop Runtime — the Engine.
 * Executes everything. Contains zero business knowledge;
 * all decisions are fetched from MCP at execution time.
 */
export type WorkflowState = "pending" | "running" | "completed" | "failed";

export interface WorkflowInstance {
  id: ID;
  definitionId: ID;
  businessId: ID;
  state: WorkflowState;
}

export interface LoopRuntime {
  start(definitionId: ID, businessId: ID): Promise<WorkflowInstance>;
}
