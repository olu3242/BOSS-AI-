import type { Workflow } from "@boss/types";
import type { WorkflowRepository } from "@boss/db";
import { ApiError } from "../http/apiError.js";

export interface WorkflowService {
  create(orgId: string, businessId: string, input: {
    name: string;
    description?: string | null;
    triggerEvent: string;
    configuration?: Record<string, unknown>;
    ownerId?: string | null;
    tags?: string[];
  }): Promise<Workflow>;
  getById(orgId: string, id: string): Promise<Workflow>;
  list(orgId: string, businessId: string): Promise<Workflow[]>;
  listByTriggerEvent(orgId: string, triggerEvent: string): Promise<Workflow[]>;
  update(orgId: string, id: string, patch: Partial<Pick<Workflow, "name" | "description" | "triggerEvent" | "configuration" | "ownerId" | "tags">>): Promise<Workflow>;
  publish(orgId: string, id: string): Promise<Workflow>;
  archive(orgId: string, id: string): Promise<Workflow>;
  delete(orgId: string, id: string): Promise<void>;
}

export function createWorkflowService(repo: WorkflowRepository): WorkflowService {
  return {
    async create(orgId, businessId, input) {
      return repo.create({
        orgId,
        businessId,
        name: input.name,
        description: input.description ?? null,
        triggerEvent: input.triggerEvent,
        status: "draft",
        version: 1,
        configuration: input.configuration ?? {},
        ownerId: input.ownerId ?? null,
        tags: input.tags ?? [],
      });
    },

    async getById(orgId, id) {
      const wf = await repo.findById(orgId, id);
      if (!wf) throw new ApiError(404, "WORKFLOW_NOT_FOUND", `Workflow ${id} not found`);
      return wf;
    },

    async list(orgId, businessId) {
      return repo.listByBusinessId(orgId, businessId);
    },

    async listByTriggerEvent(orgId, triggerEvent) {
      return repo.listByTriggerEvent(orgId, triggerEvent);
    },

    async update(orgId, id, patch) {
      const wf = await repo.findById(orgId, id);
      if (!wf) throw new ApiError(404, "WORKFLOW_NOT_FOUND", `Workflow ${id} not found`);
      if (wf.status === "archived") throw new ApiError(409, "WORKFLOW_ARCHIVED", "Cannot update an archived workflow");
      return repo.update(orgId, id, patch);
    },

    async publish(orgId, id) {
      const wf = await repo.findById(orgId, id);
      if (!wf) throw new ApiError(404, "WORKFLOW_NOT_FOUND", `Workflow ${id} not found`);
      if (wf.status === "archived") throw new ApiError(409, "WORKFLOW_ARCHIVED", "Cannot publish an archived workflow");
      return repo.update(orgId, id, { status: "published" });
    },

    async archive(orgId, id) {
      const wf = await repo.findById(orgId, id);
      if (!wf) throw new ApiError(404, "WORKFLOW_NOT_FOUND", `Workflow ${id} not found`);
      return repo.update(orgId, id, { status: "archived" });
    },

    async delete(orgId, id) {
      const wf = await repo.findById(orgId, id);
      if (!wf) throw new ApiError(404, "WORKFLOW_NOT_FOUND", `Workflow ${id} not found`);
      await repo.delete(orgId, id);
    },
  };
}
