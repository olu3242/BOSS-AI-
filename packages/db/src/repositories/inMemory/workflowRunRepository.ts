import { randomUUID } from "node:crypto";
import type { WorkflowRun } from "@boss/types";
import type { WorkflowRunRepository } from "../types.js";

export function createInMemoryWorkflowRunRepository(): WorkflowRunRepository {
  const store = new Map<string, WorkflowRun>();

  function stamp() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, deletedAt: null };
  }

  return {
    async create(input) {
      const run: WorkflowRun = { ...input, id: randomUUID(), ...stamp() };
      store.set(run.id, run);
      return run;
    },

    async findById(orgId, id) {
      const run = store.get(id);
      return run && run.orgId === orgId && !run.deletedAt ? run : null;
    },

    async update(orgId, id, patch) {
      const run = store.get(id);
      if (!run || run.orgId !== orgId || run.deletedAt) throw new Error(`WorkflowRun ${id} not found`);
      const updated: WorkflowRun = { ...run, ...patch, updatedAt: new Date().toISOString() };
      store.set(id, updated);
      return updated;
    },

    async listByBusinessId(orgId, businessId) {
      return [...store.values()].filter(
        (r) => r.orgId === orgId && r.businessId === businessId && !r.deletedAt
      );
    },

    async listByWorkflow(orgId, workflowId) {
      return [...store.values()].filter(
        (r) => r.orgId === orgId && r.workflowId === workflowId && !r.deletedAt
      );
    },

    async listByObject(orgId, businessObjectType, businessObjectId) {
      return [...store.values()].filter(
        (r) => r.orgId === orgId && r.businessObjectType === businessObjectType &&
               r.businessObjectId === businessObjectId && !r.deletedAt
      );
    },
  };
}
