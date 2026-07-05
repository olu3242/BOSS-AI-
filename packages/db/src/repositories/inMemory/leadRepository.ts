import { randomUUID } from "node:crypto";
import type { Lead, LeadStatus } from "@boss/types";
import type { LeadRepository } from "../types.js";

export function createInMemoryLeadRepository(): LeadRepository {
  const store = new Map<string, Lead>();

  function stamp() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, deletedAt: null };
  }

  return {
    async create(input) {
      const lead: Lead = {
        ...input,
        id: randomUUID(),
        tags: input.tags ?? [],
        ...stamp(),
      };
      store.set(lead.id, lead);
      return lead;
    },

    async findById(orgId, id) {
      const l = store.get(id);
      return l && l.orgId === orgId && !l.deletedAt ? l : null;
    },

    async update(orgId, id, patch) {
      const existing = store.get(id);
      if (!existing || existing.orgId !== orgId || existing.deletedAt) throw new Error(`Lead ${id} not found`);
      const updated: Lead = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      store.set(id, updated);
      return updated;
    },

    async updateStatus(orgId, id, status: LeadStatus) {
      const existing = store.get(id);
      if (!existing || existing.orgId !== orgId || existing.deletedAt) throw new Error(`Lead ${id} not found`);
      const updated: Lead = { ...existing, status, updatedAt: new Date().toISOString() };
      store.set(id, updated);
      return updated;
    },

    async delete(orgId, id) {
      const existing = store.get(id);
      if (existing && existing.orgId === orgId) {
        store.set(id, { ...existing, deletedAt: new Date().toISOString() });
      }
    },

    async listByBusinessId(orgId, businessId) {
      return Array.from(store.values())
        .filter((l) => l.orgId === orgId && l.businessId === businessId && !l.deletedAt)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async listByStatus(orgId, businessId, status: LeadStatus) {
      return Array.from(store.values())
        .filter((l) => l.orgId === orgId && l.businessId === businessId && l.status === status && !l.deletedAt)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async search(orgId, businessId, q) {
      const lower = q.toLowerCase();
      return Array.from(store.values())
        .filter(
          (l) =>
            l.orgId === orgId && l.businessId === businessId && !l.deletedAt &&
            (l.firstName.toLowerCase().includes(lower) ||
             l.lastName.toLowerCase().includes(lower) ||
             l.email?.toLowerCase().includes(lower) ||
             l.phone?.toLowerCase().includes(lower))
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  };
}
