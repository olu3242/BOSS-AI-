import { randomUUID } from "node:crypto";
import type { Conversation } from "@boss/types";
import type { ConversationRepository } from "../types.js";

export function createInMemoryConversationRepository(): ConversationRepository {
  const store = new Map<string, Conversation>();

  function stamp() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, deletedAt: null };
  }

  return {
    async create(input) {
      const conv: Conversation = {
        ...input,
        id: randomUUID(),
        occurredAt: input.occurredAt ?? new Date().toISOString(),
        ...stamp(),
      };
      store.set(conv.id, conv);
      return conv;
    },
    async findById(orgId, id) {
      const c = store.get(id);
      return c && c.orgId === orgId && !c.deletedAt ? c : null;
    },
    async update(orgId, id, patch) {
      const existing = store.get(id);
      if (!existing || existing.orgId !== orgId || existing.deletedAt) throw new Error(`Conversation ${id} not found`);
      const updated: Conversation = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      store.set(id, updated);
      return updated;
    },
    async delete(orgId, id) {
      const c = store.get(id);
      if (c && c.orgId === orgId) store.set(id, { ...c, deletedAt: new Date().toISOString() });
    },
    async listByBusinessId(orgId, businessId, limit = 50) {
      return Array.from(store.values())
        .filter((c) => c.orgId === orgId && c.businessId === businessId && !c.deletedAt)
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
        .slice(0, limit);
    },
    async listByCustomer(orgId, customerId) {
      return Array.from(store.values())
        .filter((c) => c.orgId === orgId && c.customerId === customerId && !c.deletedAt)
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    },
  };
}
