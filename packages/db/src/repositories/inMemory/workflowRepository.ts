import { randomUUID } from "node:crypto";
import type { Workflow } from "@boss/types";
import type { WorkflowRepository } from "../types.js";

export function createInMemoryWorkflowRepository(): WorkflowRepository {
  const store = new Map<string, Workflow>();

  function stamp() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, deletedAt: null };
  }

  return {
    async create(input) {
      const wf: Workflow = { ...input, id: randomUUID(), ...stamp() };
      store.set(wf.id, wf);
      return wf;
    },

    async findById(orgId, id) {
      const wf = store.get(id);
      return wf && wf.orgId === orgId && !wf.deletedAt ? wf : null;
    },

    async update(orgId, id, patch) {
      const wf = store.get(id);
      if (!wf || wf.orgId !== orgId || wf.deletedAt) throw new Error(`Workflow ${id} not found`);
      const updated: Workflow = { ...wf, ...patch, updatedAt: new Date().toISOString() };
      store.set(id, updated);
      return updated;
    },

    async delete(orgId, id) {
      const wf = store.get(id);
      if (wf && wf.orgId === orgId) {
        store.set(id, { ...wf, deletedAt: new Date().toISOString() });
      }
    },

    async listByBusinessId(orgId, businessId) {
      return [...store.values()].filter(
        (wf) => wf.orgId === orgId && wf.businessId === businessId && !wf.deletedAt
      );
    },

    async listByTriggerEvent(orgId, triggerEvent) {
      return [...store.values()].filter(
        (wf) => wf.orgId === orgId && wf.triggerEvent === triggerEvent && wf.status === 'published' && !wf.deletedAt
      );
    },
  };
}
