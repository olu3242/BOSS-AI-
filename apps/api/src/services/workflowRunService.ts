import type { WorkflowRun } from "@boss/types";
import type { WorkflowRunRepository } from "@boss/db";
import { ApiError } from "../http/apiError.js";

export interface WorkflowRunService {
  create(orgId: string, businessId: string, input: {
    workflowId: string;
    triggeredBy: string;
    businessObjectType?: string | null;
    businessObjectId?: string | null;
    runtimeExecutionId?: string | null;
  }): Promise<WorkflowRun>;
  getById(orgId: string, id: string): Promise<WorkflowRun>;
  listByBusiness(orgId: string, businessId: string): Promise<WorkflowRun[]>;
  listByWorkflow(orgId: string, workflowId: string): Promise<WorkflowRun[]>;
  listByObject(orgId: string, businessObjectType: string, businessObjectId: string): Promise<WorkflowRun[]>;
  complete(orgId: string, id: string, result: Record<string, unknown>, durationMs: number): Promise<WorkflowRun>;
  fail(orgId: string, id: string, errorMessage: string, durationMs: number): Promise<WorkflowRun>;
  cancel(orgId: string, id: string): Promise<WorkflowRun>;
}

export function createWorkflowRunService(repo: WorkflowRunRepository): WorkflowRunService {
  return {
    async create(orgId, businessId, input) {
      return repo.create({
        orgId,
        businessId,
        workflowId: input.workflowId,
        status: "pending",
        triggeredBy: input.triggeredBy,
        businessObjectType: input.businessObjectType ?? null,
        businessObjectId: input.businessObjectId ?? null,
        runtimeExecutionId: input.runtimeExecutionId ?? null,
        result: null,
        errorMessage: null,
        durationMs: null,
        startedAt: new Date().toISOString(),
        completedAt: null,
      });
    },

    async getById(orgId, id) {
      const run = await repo.findById(orgId, id);
      if (!run) throw new ApiError(404, "WORKFLOW_RUN_NOT_FOUND", `WorkflowRun ${id} not found`);
      return run;
    },

    async listByBusiness(orgId, businessId) {
      return repo.listByBusinessId(orgId, businessId);
    },

    async listByWorkflow(orgId, workflowId) {
      return repo.listByWorkflow(orgId, workflowId);
    },

    async listByObject(orgId, businessObjectType, businessObjectId) {
      return repo.listByObject(orgId, businessObjectType, businessObjectId);
    },

    async complete(orgId, id, result, durationMs) {
      const run = await repo.findById(orgId, id);
      if (!run) throw new ApiError(404, "WORKFLOW_RUN_NOT_FOUND", `WorkflowRun ${id} not found`);
      return repo.update(orgId, id, {
        status: "completed",
        result,
        durationMs,
        completedAt: new Date().toISOString(),
      });
    },

    async fail(orgId, id, errorMessage, durationMs) {
      const run = await repo.findById(orgId, id);
      if (!run) throw new ApiError(404, "WORKFLOW_RUN_NOT_FOUND", `WorkflowRun ${id} not found`);
      return repo.update(orgId, id, {
        status: "failed",
        errorMessage,
        durationMs,
        completedAt: new Date().toISOString(),
      });
    },

    async cancel(orgId, id) {
      const run = await repo.findById(orgId, id);
      if (!run) throw new ApiError(404, "WORKFLOW_RUN_NOT_FOUND", `WorkflowRun ${id} not found`);
      if (run.status === "completed" || run.status === "failed") {
        throw new ApiError(409, "WORKFLOW_RUN_TERMINAL", "Cannot cancel a completed or failed run");
      }
      return repo.update(orgId, id, {
        status: "cancelled",
        completedAt: new Date().toISOString(),
      });
    },
  };
}
