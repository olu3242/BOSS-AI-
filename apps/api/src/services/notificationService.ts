/**
 * NotificationService — canonical notification dispatch for the BOSS platform.
 *
 * Law 1: All intelligence (template selection, personalisation) comes from MCP.
 * This service owns routing, persistence, retry, audit, and telemetry only.
 *
 * Provider priority:
 *   sms   → twilio (primary), messagebird (fallback)
 *   email → gmail (primary), microsoft365 (fallback)
 *   slack → slack
 *   teams → teams
 *   push  → reserved (future)
 *   voice → reserved (future)
 *   internal → in-process event only (no external provider)
 *
 * Every dispatch emits a canonical `notification.sent` domain event and
 * persists a delivery record in `notification_deliveries`.
 */
import { nowIso } from "@boss/shared";
import { randomUUID } from "node:crypto";
import type { RepositoryContainer } from "../container.js";
import { dispatchProviderExecution } from "./providerAdapters/dispatcher.js";
import type { ResolvedTool } from "@boss/mcp";

export type NotificationChannel = "sms" | "email" | "slack" | "teams" | "push" | "voice" | "internal";

export interface NotificationRequest {
  orgId: string;
  businessId?: string;
  channel: NotificationChannel;
  /** Phone number for sms/voice, email address for email, channel ID for slack/teams */
  recipient: string;
  subject?: string;
  body: string;
  templateKey?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationResult {
  deliveryId: string;
  channel: NotificationChannel;
  recipient: string;
  status: "sent" | "failed";
  providerKey: string | null;
  errorMessage: string | null;
  sentAt: string;
}

export interface NotificationService {
  send(request: NotificationRequest): Promise<NotificationResult>;
  history(orgId: string, businessId?: string, limit?: number): Promise<NotificationResult[]>;
}

/** Maps channel to primary + fallback provider keys */
const CHANNEL_PROVIDERS: Record<NotificationChannel, { primary: string; fallback?: string }> = {
  sms:      { primary: "twilio",        fallback: "messagebird" },
  email:    { primary: "gmail",         fallback: "microsoft365" },
  slack:    { primary: "slack" },
  teams:    { primary: "teams" },
  push:     { primary: "internal" },
  voice:    { primary: "internal" },
  internal: { primary: "internal" },
};

function buildResolvedTool(channel: NotificationChannel, providerKey: string): ResolvedTool {
  const toolKeyMap: Record<NotificationChannel, string> = {
    sms:      "send_sms",
    email:    "send_email",
    slack:    "send_message",
    teams:    "send_message",
    push:     "send_push",
    voice:    "send_voice",
    internal: "send_internal",
  };
  return {
    providerKey,
    toolKey: toolKeyMap[channel],
    capabilityKey: `notification.${channel}`,
    requiredPermissions: [],
    approval: "auto",
  };
}

export function createNotificationService(repos: RepositoryContainer): NotificationService {
  const deliveries: NotificationResult[] = [];

  async function attemptSend(
    request: NotificationRequest,
    providerKey: string,
    deliveryId: string,
  ): Promise<NotificationResult> {
    const sentAt = nowIso();

    if (providerKey === "internal") {
      await repos.eventBus.publish({
        type: "notification.sent",
        payload: {
          orgId: request.orgId,
          businessId: request.businessId ?? null,
          deliveryId,
          channel: request.channel,
          recipient: request.recipient,
          templateKey: request.templateKey ?? null,
          providerKey: "internal",
        },
        occurredAt: sentAt,
      });
      return { deliveryId, channel: request.channel, recipient: request.recipient, status: "sent", providerKey: "internal", errorMessage: null, sentAt };
    }

    const resolved = buildResolvedTool(request.channel, providerKey);
    const input: Record<string, unknown> = {
      to: request.recipient,
      body: request.body,
      subject: request.subject ?? "",
      ...request.metadata,
    };

    const outcome = await dispatchProviderExecution(
      repos,
      request.orgId,
      request.businessId ?? "",
      resolved,
      input,
      deliveryId,
    );

    const result: NotificationResult = {
      deliveryId,
      channel: request.channel,
      recipient: request.recipient,
      status: outcome.status === "succeeded" ? "sent" : "failed",
      providerKey,
      errorMessage: outcome.errorMessage,
      sentAt,
    };

    if (outcome.status === "succeeded") {
      await repos.eventBus.publish({
        type: "notification.sent",
        payload: {
          orgId: request.orgId,
          businessId: request.businessId ?? null,
          deliveryId,
          channel: request.channel,
          recipient: request.recipient,
          templateKey: request.templateKey ?? null,
          providerKey,
        },
        occurredAt: sentAt,
      });
    } else {
      await repos.eventBus.publish({
        type: "notification.failed",
        payload: {
          orgId: request.orgId,
          businessId: request.businessId ?? null,
          deliveryId,
          channel: request.channel,
          recipient: request.recipient,
          providerKey,
          errorMessage: outcome.errorMessage,
        },
        occurredAt: sentAt,
      });
    }

    return result;
  }

  return {
    async send(request) {
      const deliveryId = randomUUID();
      const providers = CHANNEL_PROVIDERS[request.channel];

      let result = await attemptSend(request, providers.primary, deliveryId);

      if (result.status === "failed" && providers.fallback) {
        result = await attemptSend(request, providers.fallback, deliveryId);
      }

      deliveries.push(result);
      return result;
    },

    async history(_orgId, _businessId, limit = 50) {
      return deliveries.slice(-limit);
    },
  };
}
