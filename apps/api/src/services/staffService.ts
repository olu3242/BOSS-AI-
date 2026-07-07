import type { StaffMember, StaffStatus } from "@boss/types";
import { createBossEvent } from "@boss/events";
import type { RepositoryContainer } from "../container.js";

export interface StaffService {
  create(
    orgId: string,
    businessId: string,
    input: {
      userId: string;
      firstName: string;
      lastName?: string;
      email?: string | null;
      phone?: string | null;
      role: string;
      department?: string | null;
      status?: StaffStatus;
      hireDate?: string | null;
      tags?: string[];
      notes?: string | null;
    },
    actorId: string,
  ): Promise<StaffMember>;

  get(orgId: string, id: string): Promise<StaffMember>;
  list(orgId: string, businessId: string): Promise<StaffMember[]>;

  update(
    orgId: string,
    id: string,
    patch: Partial<{
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
      role: string;
      department: string | null;
      status: StaffStatus;
      hireDate: string | null;
      tags: string[];
      notes: string | null;
    }>,
    actorId: string,
  ): Promise<StaffMember>;

  delete(orgId: string, id: string, actorId: string): Promise<void>;
}

export function createStaffService(repos: RepositoryContainer): StaffService {
  return {
    async create(orgId, businessId, input, actorId) {
      const member = await repos.staff.create({
        orgId,
        businessId,
        userId: input.userId,
        firstName: input.firstName,
        lastName: input.lastName ?? "",
        email: input.email ?? null,
        phone: input.phone ?? null,
        role: input.role,
        department: input.department ?? null,
        status: input.status ?? "active",
        hireDate: input.hireDate ?? null,
        tags: input.tags ?? [],
        notes: input.notes ?? null,
      });

      await repos.eventBus.publish(
        createBossEvent(
          "staff.created",
          { staffId: member.id, businessId, role: member.role },
          { orgId, businessId, actorId, requestId: member.id, correlationId: member.id, traceId: member.id },
        ),
      );

      return member;
    },

    async get(orgId, id) {
      const member = await repos.staff.findById(orgId, id);
      if (!member) throw Object.assign(new Error(`Staff member ${id} not found`), { statusCode: 404 });
      return member;
    },

    async list(orgId, businessId) {
      return repos.staff.listByBusinessId(orgId, businessId);
    },

    async update(orgId, id, patch, actorId) {
      const member = await repos.staff.update(orgId, id, patch);

      await repos.eventBus.publish(
        createBossEvent(
          "staff.updated",
          { staffId: id, changes: Object.keys(patch) },
          { orgId, businessId: member.businessId, actorId, requestId: id, correlationId: id, traceId: id },
        ),
      );

      return member;
    },

    async delete(orgId, id, actorId) {
      const member = await repos.staff.findById(orgId, id);
      if (!member) throw Object.assign(new Error(`Staff member ${id} not found`), { statusCode: 404 });

      await repos.staff.delete(orgId, id);

      await repos.eventBus.publish(
        createBossEvent(
          "staff.deleted",
          { staffId: id },
          { orgId, businessId: member.businessId, actorId, requestId: id, correlationId: id, traceId: id },
        ),
      );
    },
  };
}
