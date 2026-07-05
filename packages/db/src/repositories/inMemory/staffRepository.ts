import { randomUUID } from "node:crypto";
import type { StaffMember } from "@boss/types";
import type { StaffRepository } from "../types.js";

export function createInMemoryStaffRepository(): StaffRepository {
  const store = new Map<string, StaffMember>();

  function stamp() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, deletedAt: null };
  }

  return {
    async create(input) {
      const member: StaffMember = { ...input, id: randomUUID(), tags: input.tags ?? [], ...stamp() };
      store.set(member.id, member);
      return member;
    },
    async findById(orgId, id) {
      const m = store.get(id);
      return m && m.orgId === orgId && !m.deletedAt ? m : null;
    },
    async update(orgId, id, patch) {
      const existing = store.get(id);
      if (!existing || existing.orgId !== orgId || existing.deletedAt) throw new Error(`Staff ${id} not found`);
      const updated: StaffMember = { ...existing, ...patch, updatedAt: new Date().toISOString() };
      store.set(id, updated);
      return updated;
    },
    async delete(orgId, id) {
      const m = store.get(id);
      if (m && m.orgId === orgId) store.set(id, { ...m, deletedAt: new Date().toISOString() });
    },
    async listByBusinessId(orgId, businessId) {
      return Array.from(store.values())
        .filter((m) => m.orgId === orgId && m.businessId === businessId && !m.deletedAt)
        .sort((a, b) => a.firstName.localeCompare(b.firstName));
    },
    async findByUserId(orgId, userId) {
      return Array.from(store.values()).find((m) => m.orgId === orgId && m.userId === userId && !m.deletedAt) ?? null;
    },
  };
}
