import { randomUUID } from "node:crypto";
import type { Appointment } from "@boss/types";
import type { AppointmentRepository } from "../types.js";

export function createInMemoryAppointmentRepository(): AppointmentRepository {
  const store = new Map<string, Appointment>();
  const now = () => new Date().toISOString();

  return {
    async create(input) {
      const t = now();
      const record: Appointment = {
        ...input,
        id: randomUUID(),
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
      if (!r || r.orgId !== orgId || r.deletedAt) throw new Error(`Appointment ${id} not found`);
      const updated: Appointment = { ...r, ...patch, updatedAt: now() };
      store.set(id, updated);
      return updated;
    },

    async listByBusiness(orgId, businessId) {
      return [...store.values()]
        .filter((r) => r.orgId === orgId && r.businessId === businessId && !r.deletedAt)
        .sort((a, b) => a.startAt.localeCompare(b.startAt));
    },

    async listByCustomer(orgId, customerId) {
      return [...store.values()]
        .filter((r) => r.orgId === orgId && r.customerId === customerId && !r.deletedAt)
        .sort((a, b) => a.startAt.localeCompare(b.startAt));
    },

    async softDelete(orgId, id) {
      const r = store.get(id);
      if (r && r.orgId === orgId) {
        store.set(id, { ...r, deletedAt: now(), updatedAt: now() });
      }
    },
  };
}
