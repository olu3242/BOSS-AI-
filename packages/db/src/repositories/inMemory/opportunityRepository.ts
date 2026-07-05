import { randomUUID } from "node:crypto";
import type { Opportunity, OpportunityStage } from "@boss/types";
import type { OpportunityRepository } from "../types.js";

export function createInMemoryOpportunityRepository(): OpportunityRepository {
  const store = new Map<string, Opportunity>();

  function stamp() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, deletedAt: null };
  }

  return {
    async create(input) {
      const opp: Opportunity = { ...input, id: randomUUID(), tags: input.tags ?? [], ...stamp() };
      store.set(opp.id, opp);
      return opp;
    },
    async findById(orgId, id) {
      const o = store.get(id);
      return o && o.orgId === orgId && !o.deletedAt ? o : null;
    },
    async update(orgId, id, patch) {
      const existing = store.get(id);
      if (!existing || existing.orgId !== orgId || existing.deletedAt) throw new Error(`Opportunity ${id} not found`);
      const updated: Opportunity = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      store.set(id, updated);
      return updated;
    },
    async delete(orgId, id) {
      const o = store.get(id);
      if (o && o.orgId === orgId) store.set(id, { ...o, deletedAt: new Date().toISOString() });
    },
    async listByBusinessId(orgId, businessId) {
      return Array.from(store.values())
        .filter((o) => o.orgId === orgId && o.businessId === businessId && !o.deletedAt)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async listByStage(orgId, businessId, stage: OpportunityStage) {
      return Array.from(store.values())
        .filter((o) => o.orgId === orgId && o.businessId === businessId && o.stage === stage && !o.deletedAt)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async listByCustomer(orgId, customerId) {
      return Array.from(store.values())
        .filter((o) => o.orgId === orgId && o.customerId === customerId && !o.deletedAt)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  };
}
