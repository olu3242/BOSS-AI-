import { randomUUID } from "node:crypto";
import type { Job } from "@boss/types";
import type { JobRepository } from "../types.js";

export function createInMemoryJobRepository(): JobRepository {
  const store = new Map<string, Job>();
  const now = () => new Date().toISOString();

  return {
    async create(input) {
      const t = now();
      const record: Job = {
        ...input,
        id: randomUUID(),
        tags: input.tags ?? [],
        metadata: input.metadata ?? {},
        createdAt: t,
        updatedAt: t,
        deletedAt: null,
      };
      store.set(record.id, record);
      return record;
    },

    async findById(orgId, id) {
      const r = store.get(id);
      return r && r.orgId === orgId && !r.deletedAt ? r : null;
    },

    async update(orgId, id, patch) {
      const r = store.get(id);
      if (!r || r.orgId !== orgId || r.deletedAt) throw new Error(`Job ${id} not found`);
      const updated: Job = { ...r, ...patch, updatedAt: now() };
      store.set(id, updated);
      return updated;
    },

    async listByBusiness(orgId, businessId) {
      return [...store.values()]
        .filter((r) => r.orgId === orgId && r.businessId === businessId && !r.deletedAt)
        .sort((a, b) => (b.scheduledAt ?? b.createdAt).localeCompare(a.scheduledAt ?? a.createdAt));
    },

    async listByCustomer(orgId, customerId) {
      return [...store.values()]
        .filter((r) => r.orgId === orgId && r.customerId === customerId && !r.deletedAt)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async softDelete(orgId, id) {
      const r = store.get(id);
      if (r && r.orgId === orgId) {
        store.set(id, { ...r, deletedAt: now(), updatedAt: now() });
      }
    },
  };
}
