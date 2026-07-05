import { randomUUID } from "node:crypto";
import type { StandaloneTask } from "@boss/types";
import type { TaskRepository } from "../types.js";

const PRIORITY_ORDER = { urgent: 1, high: 2, normal: 3, low: 4 };

export function createInMemoryTaskRepository(): TaskRepository {
  const store = new Map<string, StandaloneTask>();

  function stamp() {
    const now = new Date().toISOString();
    return { createdAt: now, updatedAt: now, deletedAt: null };
  }

  return {
    async create(input) {
      const task: StandaloneTask = { ...input, id: randomUUID(), tags: input.tags ?? [], ...stamp() };
      store.set(task.id, task);
      return task;
    },
    async findById(orgId, id) {
      const t = store.get(id);
      return t && t.orgId === orgId && !t.deletedAt ? t : null;
    },
    async update(orgId, id, patch) {
      const existing = store.get(id);
      if (!existing || existing.orgId !== orgId || existing.deletedAt) throw new Error(`Task ${id} not found`);
      const completedAt = patch.status === "done" ? new Date().toISOString() : existing.completedAt;
      const updated: StandaloneTask = { ...existing, ...patch, completedAt, updatedAt: new Date().toISOString() };
      store.set(id, updated);
      return updated;
    },
    async delete(orgId, id) {
      const t = store.get(id);
      if (t && t.orgId === orgId) store.set(id, { ...t, deletedAt: new Date().toISOString() });
    },
    async listByBusinessId(orgId, businessId) {
      return Array.from(store.values())
        .filter((t) => t.orgId === orgId && t.businessId === businessId && !t.deletedAt)
        .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 5) - (PRIORITY_ORDER[b.priority] ?? 5));
    },
    async listChildren(orgId, parentTaskId) {
      return Array.from(store.values())
        .filter((t) => t.orgId === orgId && t.parentTaskId === parentTaskId && !t.deletedAt)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
  };
}
