import { randomUUID } from "node:crypto";
import type { LifecyclePolicy } from "@boss/types";
import type { LifecyclePolicyRepository } from "../types.js";

export function createInMemoryLifecyclePolicyRepository(): LifecyclePolicyRepository {
  const store = new Map<string, LifecyclePolicy>();

  function stamp() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, deletedAt: null };
  }

  return {
    async create(input) {
      const policy: LifecyclePolicy = { ...input, id: randomUUID(), ...stamp() };
      store.set(policy.id, policy);
      return policy;
    },

    async findById(orgId, id) {
      const p = store.get(id);
      return p && p.orgId === orgId && !p.deletedAt ? p : null;
    },

    async update(orgId, id, patch) {
      const p = store.get(id);
      if (!p || p.orgId !== orgId || p.deletedAt) throw new Error(`LifecyclePolicy ${id} not found`);
      const updated: LifecyclePolicy = { ...p, ...patch, updatedAt: new Date().toISOString() };
      store.set(id, updated);
      return updated;
    },

    async delete(orgId, id) {
      const p = store.get(id);
      if (p && p.orgId === orgId) {
        store.set(id, { ...p, deletedAt: new Date().toISOString() });
      }
    },

    async listByBusinessId(orgId, businessId) {
      return [...store.values()]
        .filter((p) => p.orgId === orgId && p.businessId === businessId && !p.deletedAt)
        .sort((a, b) => b.priority - a.priority);
    },

    async listByEvent(orgId, businessId, fromEvent) {
      return [...store.values()]
        .filter((p) => p.orgId === orgId && p.businessId === businessId &&
                       p.fromEvent === fromEvent && p.isActive && !p.deletedAt)
        .sort((a, b) => b.priority - a.priority);
    },
  };
}
