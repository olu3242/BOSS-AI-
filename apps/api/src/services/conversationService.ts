import type {
  Conversation,
  ConversationChannel,
  ConversationDirection,
  ConversationStatus,
  ConversationSentiment,
} from "@boss/types";
import { createBossEvent } from "@boss/events";
import type { RepositoryContainer } from "../container.js";

export interface ConversationService {
  create(
    orgId: string,
    businessId: string,
    input: {
      customerId?: string | null;
      channel: ConversationChannel;
      direction: ConversationDirection;
      subject?: string | null;
      body: string;
      status?: ConversationStatus;
      assignedTo?: string | null;
      sentiment?: ConversationSentiment | null;
      occurredAt?: string;
    },
    actorId: string,
  ): Promise<Conversation>;

  get(orgId: string, id: string): Promise<Conversation>;
  list(orgId: string, businessId: string, limit?: number): Promise<Conversation[]>;
  listByCustomer(orgId: string, customerId: string): Promise<Conversation[]>;

  update(
    orgId: string,
    id: string,
    patch: Partial<{
      subject: string | null;
      body: string;
      status: ConversationStatus;
      assignedTo: string | null;
      sentiment: ConversationSentiment | null;
    }>,
    actorId: string,
  ): Promise<Conversation>;

  delete(orgId: string, id: string, actorId: string): Promise<void>;
}

export function createConversationService(repos: RepositoryContainer): ConversationService {
  return {
    async create(orgId, businessId, input, actorId) {
      const conv = await repos.conversations.create({
        orgId,
        businessId,
        customerId: input.customerId ?? null,
        channel: input.channel,
        direction: input.direction,
        subject: input.subject ?? null,
        body: input.body,
        status: input.status ?? "open",
        assignedTo: input.assignedTo ?? null,
        sentiment: input.sentiment ?? null,
        occurredAt: input.occurredAt ?? new Date().toISOString(),
      });

      await repos.eventBus.publish(
        createBossEvent(
          "conversation.created",
          { conversationId: conv.id, businessId, channel: conv.channel, direction: conv.direction },
          { orgId, businessId, actorId, requestId: conv.id, correlationId: conv.id, traceId: conv.id },
        ),
      );

      return conv;
    },

    async get(orgId, id) {
      const conv = await repos.conversations.findById(orgId, id);
      if (!conv) throw Object.assign(new Error(`Conversation ${id} not found`), { statusCode: 404 });
      return conv;
    },

    async list(orgId, businessId, limit) {
      return repos.conversations.listByBusinessId(orgId, businessId, limit);
    },

    async listByCustomer(orgId, customerId) {
      return repos.conversations.listByCustomer(orgId, customerId);
    },

    async update(orgId, id, patch, actorId) {
      const existing = await repos.conversations.findById(orgId, id);
      if (!existing) throw Object.assign(new Error(`Conversation ${id} not found`), { statusCode: 404 });

      const updated = await repos.conversations.update(orgId, id, patch);

      if (patch.status && patch.status !== existing.status) {
        await repos.eventBus.publish(
          createBossEvent(
            patch.status === "resolved" ? "conversation.resolved" : "conversation.updated",
            { conversationId: id, status: patch.status },
            { orgId, businessId: existing.businessId, actorId, requestId: id, correlationId: id, traceId: id },
          ),
        );
      }

      return updated;
    },

    async delete(orgId, id, actorId) {
      const conv = await repos.conversations.findById(orgId, id);
      if (!conv) throw Object.assign(new Error(`Conversation ${id} not found`), { statusCode: 404 });

      await repos.conversations.delete(orgId, id);

      await repos.eventBus.publish(
        createBossEvent(
          "conversation.deleted",
          { conversationId: id },
          { orgId, businessId: conv.businessId, actorId, requestId: id, correlationId: id, traceId: id },
        ),
      );
    },
  };
}
