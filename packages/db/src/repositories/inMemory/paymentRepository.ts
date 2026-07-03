import { randomUUID } from "node:crypto";
import type { Payment } from "@boss/types";
import type { PaymentRepository } from "../types.js";

export function createInMemoryPaymentRepository(): PaymentRepository {
  const store = new Map<string, Payment>();
  const now = () => new Date().toISOString();

  return {
    async create(input) {
      const t = now();
      const record: Payment = {
        ...input,
        id: randomUUID(),
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
      if (!r || r.orgId !== orgId || r.deletedAt) throw new Error(`Payment ${id} not found`);
      const updated: Payment = { ...r, ...patch, updatedAt: now() };
      store.set(id, updated);
      return updated;
    },

    async listByBusiness(orgId, businessId) {
      return [...store.values()]
        .filter((r) => r.orgId === orgId && r.businessId === businessId && !r.deletedAt)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async listByInvoice(orgId, invoiceId) {
      return [...store.values()]
        .filter((r) => r.orgId === orgId && r.invoiceId === invoiceId && !r.deletedAt)
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
