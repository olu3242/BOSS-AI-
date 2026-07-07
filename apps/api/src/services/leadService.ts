import type { Lead, LeadStatus } from "@boss/types";
import type { RepositoryContainer } from "../container.js";

export interface LeadService {
  create(orgId: string, businessId: string, input: {
    firstName: string;
    lastName?: string;
    email?: string | null;
    phone?: string | null;
    source?: string;
    estimatedValue?: number | null;
    notes?: string | null;
    tags?: string[];
  }): Promise<Lead>;

  get(orgId: string, id: string): Promise<Lead>;
  list(orgId: string, businessId: string): Promise<Lead[]>;
  search(orgId: string, businessId: string, query: string): Promise<Lead[]>;

  update(orgId: string, id: string, patch: {
    firstName?: string;
    lastName?: string;
    email?: string | null;
    phone?: string | null;
    source?: string;
    notes?: string | null;
    tags?: string[];
    estimatedValue?: number | null;
    assignedTo?: string | null;
  }): Promise<Lead>;

  qualify(orgId: string, id: string, actor: string): Promise<Lead>;
  assign(orgId: string, id: string, assignedTo: string): Promise<Lead>;
  convert(orgId: string, id: string, convertedCustomerId: string): Promise<Lead>;
  markLost(orgId: string, id: string): Promise<Lead>;
  delete(orgId: string, id: string): Promise<void>;
}

export function createLeadService(repos: RepositoryContainer): LeadService {
  return {
    async create(orgId, businessId, input) {
      const lead = await repos.leads.create({
        orgId,
        businessId,
        firstName: input.firstName,
        lastName: input.lastName ?? "",
        email: input.email ?? null,
        phone: input.phone ?? null,
        source: input.source ?? "manual",
        status: "new",
        assignedTo: null,
        notes: input.notes ?? null,
        tags: input.tags ?? [],
        estimatedValue: input.estimatedValue ?? null,
        convertedCustomerId: null,
        qualifiedAt: null,
        convertedAt: null,
      });

      await repos.eventBus.publish({
        type: "lead.created",
        payload: { orgId, businessId, leadId: lead.id, source: lead.source },
        occurredAt: new Date().toISOString(),
      });

      return lead;
    },

    async get(orgId, id) {
      const lead = await repos.leads.findById(orgId, id);
      if (!lead) throw new Error(`Lead ${id} not found`);
      return lead;
    },

    async list(orgId, businessId) {
      return repos.leads.listByBusinessId(orgId, businessId);
    },

    async search(orgId, businessId, query) {
      return repos.leads.search(orgId, businessId, query);
    },

    async update(orgId, id, patch) {
      return repos.leads.update(orgId, id, patch);
    },

    async qualify(orgId, id, actor) {
      const lead = await repos.leads.update(orgId, id, {
        status: "qualified" as LeadStatus,
        qualifiedAt: new Date().toISOString(),
      });

      await repos.eventBus.publish({
        type: "lead.qualified",
        payload: { orgId, businessId: lead.businessId, leadId: id, actor },
        occurredAt: new Date().toISOString(),
      });

      return lead;
    },

    async assign(orgId, id, assignedTo) {
      const lead = await repos.leads.update(orgId, id, {
        status: "contacted" as LeadStatus,
        assignedTo,
      });

      await repos.eventBus.publish({
        type: "lead.assigned",
        payload: { orgId, businessId: lead.businessId, leadId: id, assignedTo },
        occurredAt: new Date().toISOString(),
      });

      return lead;
    },

    async convert(orgId, id, convertedCustomerId) {
      const lead = await repos.leads.update(orgId, id, {
        status: "converted" as LeadStatus,
        convertedCustomerId,
        convertedAt: new Date().toISOString(),
      });

      await repos.eventBus.publish({
        type: "lead.converted",
        payload: { orgId, businessId: lead.businessId, leadId: id, convertedCustomerId },
        occurredAt: new Date().toISOString(),
      });

      return lead;
    },

    async markLost(orgId, id) {
      return repos.leads.updateStatus(orgId, id, "lost");
    },

    async delete(orgId, id) {
      await repos.leads.delete(orgId, id);
    },
  };
}
