import { randomUUID } from "node:crypto";
import type { Invoice } from "@boss/types";
import type { InvoiceRepository } from "../types.js";

export function createInMemoryInvoiceRepository(): InvoiceRepository {
  const store = new Map<string, Invoice>();
  const now = () => new Date().toISOString();

  return {
    async create(input) {
      const t = now();
      const record: Invoice = {
        ...input,
        id: randomUUID(),
        lineItems: input.lineItems ?? [],
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
      if (!r || r.orgId !== orgId || r.deletedAt) throw new Error(`Invoice ${id} not found`);
      const updated: Invoice = { ...r, ...patch, updatedAt: now() };
      store.set(id, updated);
      return updated;
    },

    async listByBusiness(orgId, businessId) {
      return [...store.values()]
        .filter((r) => r.orgId === orgId && r.businessId === businessId && !r.deletedAt)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
