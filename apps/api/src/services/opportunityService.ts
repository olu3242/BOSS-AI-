import type { Opportunity, OpportunityStage } from "@boss/types";
import { createBossEvent } from "@boss/events";
import type { RepositoryContainer } from "../container.js";

export interface OpportunityService {
  create(
    orgId: string,
    businessId: string,
    input: {
      title: string;
      stage?: OpportunityStage;
      valueCents?: number;
      currency?: string;
      probability?: number;
      customerId?: string | null;
      leadId?: string | null;
      expectedCloseDate?: string | null;
      assignedTo?: string | null;
      source?: string | null;
      notes?: string | null;
      tags?: string[];
    },
    actorId: string,
  ): Promise<Opportunity>;

  get(orgId: string, id: string): Promise<Opportunity>;
  list(orgId: string, businessId: string): Promise<Opportunity[]>;
  listByStage(orgId: string, businessId: string, stage: OpportunityStage): Promise<Opportunity[]>;

  update(
    orgId: string,
    id: string,
    patch: Partial<{
      title: string;
      stage: OpportunityStage;
      valueCents: number;
      currency: string;
      probability: number;
      customerId: string | null;
      expectedCloseDate: string | null;
      assignedTo: string | null;
      source: string | null;
      notes: string | null;
      tags: string[];
    }>,
    actorId: string,
  ): Promise<Opportunity>;

  delete(orgId: string, id: string, actorId: string): Promise<void>;
}

export function createOpportunityService(repos: RepositoryContainer): OpportunityService {
  return {
    async create(orgId, businessId, input, actorId) {
      const opp = await repos.opportunities.create({
        orgId,
        businessId,
        title: input.title,
        stage: input.stage ?? "prospecting",
        valueCents: input.valueCents ?? 0,
        currency: input.currency ?? "USD",
        probability: input.probability ?? 0,
        customerId: input.customerId ?? null,
        leadId: input.leadId ?? null,
        expectedCloseDate: input.expectedCloseDate ?? null,
        assignedTo: input.assignedTo ?? null,
        source: input.source ?? null,
        notes: input.notes ?? null,
        tags: input.tags ?? [],
      });

      await repos.eventBus.publish(
        createBossEvent(
          "opportunity.created",
          { opportunityId: opp.id, businessId, stage: opp.stage, valueCents: opp.valueCents },
          { orgId, businessId, actorId, requestId: opp.id, correlationId: opp.id, traceId: opp.id },
        ),
      );

      return opp;
    },

    async get(orgId, id) {
      const opp = await repos.opportunities.findById(orgId, id);
      if (!opp) throw Object.assign(new Error(`Opportunity ${id} not found`), { statusCode: 404 });
      return opp;
    },

    async list(orgId, businessId) {
      return repos.opportunities.listByBusinessId(orgId, businessId);
    },

    async listByStage(orgId, businessId, stage) {
      return repos.opportunities.listByStage(orgId, businessId, stage);
    },

    async update(orgId, id, patch, actorId) {
      const existing = await repos.opportunities.findById(orgId, id);
      if (!existing) throw Object.assign(new Error(`Opportunity ${id} not found`), { statusCode: 404 });

      const updated = await repos.opportunities.update(orgId, id, patch);

      if (patch.stage && patch.stage !== existing.stage) {
        const eventType = patch.stage === "closed_won" ? "opportunity.won" : patch.stage === "closed_lost" ? "opportunity.lost" : "opportunity.stage_changed";
        await repos.eventBus.publish(
          createBossEvent(
            eventType,
            { opportunityId: id, from: existing.stage, to: patch.stage },
            { orgId, businessId: existing.businessId, actorId, requestId: id, correlationId: id, traceId: id },
          ),
        );
      }

      return updated;
    },

    async delete(orgId, id, actorId) {
      const opp = await repos.opportunities.findById(orgId, id);
      if (!opp) throw Object.assign(new Error(`Opportunity ${id} not found`), { statusCode: 404 });

      await repos.opportunities.delete(orgId, id);

      await repos.eventBus.publish(
        createBossEvent(
          "opportunity.deleted",
          { opportunityId: id },
          { orgId, businessId: opp.businessId, actorId, requestId: id, correlationId: id, traceId: id },
        ),
      );
    },
  };
}
