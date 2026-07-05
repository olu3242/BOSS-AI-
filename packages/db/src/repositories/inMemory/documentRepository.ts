import { randomUUID } from "node:crypto";
import type { Document } from "@boss/types";
import type { DocumentRepository } from "../types.js";

export function createInMemoryDocumentRepository(): DocumentRepository {
  const store = new Map<string, Document>();

  function stamp() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, deletedAt: null };
  }

  return {
    async create(input) {
      const doc: Document = { ...input, id: randomUUID(), tags: input.tags ?? [], version: input.version ?? 1, ...stamp() };
      store.set(doc.id, doc);
      return doc;
    },
    async findById(orgId, id) {
      const d = store.get(id);
      return d && d.orgId === orgId && !d.deletedAt ? d : null;
    },
    async update(orgId, id, patch) {
      const existing = store.get(id);
      if (!existing || existing.orgId !== orgId || existing.deletedAt) throw new Error(`Document ${id} not found`);
      const updated: Document = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      store.set(id, updated);
      return updated;
    },
    async delete(orgId, id) {
      const d = store.get(id);
      if (d && d.orgId === orgId) store.set(id, { ...d, deletedAt: new Date().toISOString() });
    },
    async listByBusinessId(orgId, businessId) {
      return Array.from(store.values())
        .filter((d) => d.orgId === orgId && d.businessId === businessId && !d.deletedAt)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  };
}
