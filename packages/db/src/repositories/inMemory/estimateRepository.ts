import { randomUUID } from "node:crypto";
import type { Estimate } from "@boss/types";
import type { EstimateRepository } from "../types.js";

export function createInMemoryEstimateRepository(): EstimateRepository {
  const store = new Map<string, Estimate>();

  function stamp() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, deletedAt: null };
  }

  return {
    async create(input) {
      const est: Estimate = { ...input, id: randomUUID(), lineItems: input.lineItems ?? [], ...stamp() };
      store.set(est.id, est);
      return est;
    },
    async findById(orgId, id) {
      const e = store.get(id);
      return e && e.orgId === orgId && !e.deletedAt ? e : null;
    },
    async findByNumber(orgId, estimateNumber) {
      return Array.from(store.values()).find((e) => e.orgId === orgId && e.estimateNumber === estimateNumber && !e.deletedAt) ?? null;
    },
    async update(orgId, id, patch) {
      const existing = store.get(id);
      if (!existing || existing.orgId !== orgId || existing.deletedAt) throw new Error(`Estimate ${id} not found`);
      const updated: Estimate = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      store.set(id, updated);
      return updated;
    },
    async delete(orgId, id) {
      const e = store.get(id);
      if (e && e.orgId === orgId) store.set(id, { ...e, deletedAt: new Date().toISOString() });
    },
    async listByBusinessId(orgId, businessId) {
      return Array.from(store.values())
        .filter((e) => e.orgId === orgId && e.businessId === businessId && !e.deletedAt)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async listByCustomer(orgId, customerId) {
      return Array.from(store.values())
        .filter((e) => e.orgId === orgId && e.customerId === customerId && !e.deletedAt)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  };
}
