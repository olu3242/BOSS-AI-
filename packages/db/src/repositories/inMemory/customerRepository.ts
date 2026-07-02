import { randomUUID } from "node:crypto";
import type { Customer, CustomerInteraction, CustomerStatus, CustomerInteractionType } from "@boss/types";
import type { CustomerRepository, CustomerInteractionRepository } from "../types.js";

export function createInMemoryCustomerRepository(): CustomerRepository {
  const store = new Map<string, Customer>();

  return {
    async create(input) {
      const now = new Date().toISOString();
      const record: Customer = {
        ...input,
        id: randomUUID(),
        tags: input.tags ?? [],
        totalRevenue: input.totalRevenue ?? 0,
        healthScore: input.healthScore ?? null,
        createdAt: now,
        updatedAt: now,
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
      if (!r || r.orgId !== orgId || r.deletedAt) throw new Error("Customer not found");
      const updated: Customer = { ...r, ...patch, updatedAt: new Date().toISOString() };
      store.set(id, updated);
      return updated;
    },

    async updateStatus(orgId, id, status: CustomerStatus) {
      const r = store.get(id);
      if (!r || r.orgId !== orgId || r.deletedAt) throw new Error("Customer not found");
      const updated: Customer = { ...r, status, updatedAt: new Date().toISOString() };
      store.set(id, updated);
      return updated;
    },

    async updateRevenue(orgId, id, totalRevenue) {
      const r = store.get(id);
      if (!r || r.orgId !== orgId || r.deletedAt) throw new Error("Customer not found");
      const updated: Customer = { ...r, totalRevenue, updatedAt: new Date().toISOString() };
      store.set(id, updated);
      return updated;
    },

    async delete(orgId, id) {
      const r = store.get(id);
      if (r && r.orgId === orgId) {
        store.set(id, { ...r, deletedAt: new Date().toISOString() });
      }
    },

    async listByBusinessId(orgId, businessId) {
      return [...store.values()]
        .filter((r) => r.orgId === orgId && r.businessId === businessId && !r.deletedAt)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async search(orgId, businessId, searchQuery) {
      const q = searchQuery.toLowerCase();
      return [...store.values()]
        .filter(
          (r) =>
            r.orgId === orgId &&
            r.businessId === businessId &&
            !r.deletedAt &&
            (`${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
              (r.email ?? "").toLowerCase().includes(q) ||
              (r.phone ?? "").toLowerCase().includes(q))
        )
        .slice(0, 50);
    },
  };
}

export function createInMemoryCustomerInteractionRepository(): CustomerInteractionRepository {
  const store = new Map<string, CustomerInteraction>();

  return {
    async create(input) {
      const now = new Date().toISOString();
      const record: CustomerInteraction = {
        ...input,
        id: randomUUID(),
        metadata: input.metadata ?? {},
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      store.set(record.id, record);
      return record;
    },

    async listByCustomerId(orgId, customerId) {
      return [...store.values()]
        .filter((r) => r.orgId === orgId && r.customerId === customerId && !r.deletedAt)
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    },

    async listByBusinessId(orgId, businessId, limit = 50) {
      return [...store.values()]
        .filter((r) => r.orgId === orgId && r.businessId === businessId && !r.deletedAt)
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
        .slice(0, limit);
    },

    async countByType(orgId, customerId, type: CustomerInteractionType) {
      return [...store.values()].filter(
        (r) => r.orgId === orgId && r.customerId === customerId && r.type === type && !r.deletedAt
      ).length;
    },
  };
}
