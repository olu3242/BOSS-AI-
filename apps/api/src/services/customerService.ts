import type { Customer, CustomerInteraction } from "@boss/types";
import type { RepositoryContainer } from "../container.js";

export interface CustomerService {
  create(orgId: string, businessId: string, input: {
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    source?: string | null;
    tags?: string[];
    notes?: string | null;
  }): Promise<Customer>;

  get(orgId: string, id: string): Promise<Customer>;
  list(orgId: string, businessId: string): Promise<Customer[]>;
  search(orgId: string, businessId: string, query: string): Promise<Customer[]>;

  update(orgId: string, id: string, patch: {
    firstName?: string;
    lastName?: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    status?: Customer["status"];
    tags?: string[];
    notes?: string | null;
    healthScore?: number | null;
  }): Promise<Customer>;

  delete(orgId: string, id: string): Promise<void>;

  addInteraction(orgId: string, businessId: string, customerId: string, input: {
    type: CustomerInteraction["type"];
    summary: string;
    metadata?: Record<string, unknown>;
    occurredAt?: string;
  }): Promise<CustomerInteraction>;

  listInteractions(orgId: string, customerId: string): Promise<CustomerInteraction[]>;
}

export function createCustomerService(repos: RepositoryContainer): CustomerService {
  return {
    async create(orgId, businessId, input) {
      const customer = await repos.customers.create({
        orgId,
        businessId,
        firstName: input.firstName,
        lastName: input.lastName ?? "",
        email: input.email ?? null,
        phone: input.phone ?? null,
        address: input.address ?? null,
        status: "prospect",
        source: (input.source ?? null) as Customer["source"],
        tags: input.tags ?? [],
        notes: input.notes ?? null,
        totalRevenue: 0,
        healthScore: null,
        lastContactAt: null,
      });

      await repos.customerInteractions.create({
        orgId,
        businessId,
        customerId: customer.id,
        type: "note",
        summary: "Customer record created",
        metadata: {},
        occurredAt: new Date().toISOString(),
      });

      await repos.eventBus.publish({
        type: "customer.created",
        payload: { orgId, businessId, customerId: customer.id },
        occurredAt: new Date().toISOString(),
      });

      return customer;
    },

    async get(orgId, id) {
      const customer = await repos.customers.findById(orgId, id);
      if (!customer) throw new Error(`Customer ${id} not found`);
      return customer;
    },

    async list(orgId, businessId) {
      return repos.customers.listByBusinessId(orgId, businessId);
    },

    async search(orgId, businessId, query) {
      if (!query.trim()) return repos.customers.listByBusinessId(orgId, businessId);
      return repos.customers.search(orgId, businessId, query);
    },

    async update(orgId, id, patch) {
      return repos.customers.update(orgId, id, patch);
    },

    async delete(orgId, id) {
      await repos.customers.delete(orgId, id);
    },

    async addInteraction(orgId, businessId, customerId, input) {
      const interaction = await repos.customerInteractions.create({
        orgId,
        businessId,
        customerId,
        type: input.type,
        summary: input.summary,
        metadata: input.metadata ?? {},
        occurredAt: input.occurredAt ?? new Date().toISOString(),
      });

      await repos.customers.update(orgId, customerId, {
        lastContactAt: interaction.occurredAt,
      });

      return interaction;
    },

    async listInteractions(orgId, customerId) {
      return repos.customerInteractions.listByCustomerId(orgId, customerId);
    },
  };
}
