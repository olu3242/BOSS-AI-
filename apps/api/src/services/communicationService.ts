/**
 * Communication Platform — canonical communication layer for BOSS.
 *
 * Architecture:
 *   CommunicationService → NotificationService → ProviderDispatcher
 *
 * This layer adds:
 *   - Template rendering (variable substitution)
 *   - Retry engine (exponential backoff, max attempts)
 *   - Delivery record tracking (in-memory; postgres backed in prod via NotificationService)
 *   - Escalation (route to fallback channel on repeated failure)
 *   - Localization hook (locale-aware template selection)
 *   - Event-driven (notification.queued / notification.delivered / notification.failed)
 *   - Provider abstraction (consumers never reference providers directly)
 *
 * Every notification in the platform flows through this service.
 * No code path may call NotificationService directly — always use CommunicationService.
 */
import { randomUUID } from "node:crypto";
import { createBossEvent, type EventBus } from "@boss/events";
import type { NotificationService, NotificationChannel, NotificationRequest, NotificationResult } from "./notificationService.js";

// ── Template Engine ───────────────────────────────────────────────────────────

export interface NotificationTemplate {
  key: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  locale: string;
}

/** Simple {{variable}} substitution. */
function renderTemplate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key as string] ?? ""));
}

// ── Built-in templates ────────────────────────────────────────────────────────

const BUILT_IN_TEMPLATES: NotificationTemplate[] = [
  // Lead
  { key: "lead.qualified",        channel: "email",    subject: "Your inquiry has been reviewed", body: "Hi {{customerName}},\n\nThank you for your interest. We've reviewed your inquiry and our team will reach out shortly.\n\nBest,\n{{businessName}}", locale: "en" },
  { key: "lead.converted",        channel: "internal", body: "Lead {{leadId}} converted to opportunity for {{businessName}}", locale: "en" },
  // Appointment
  { key: "appointment.reminder",  channel: "sms",      body: "Hi {{customerName}}, reminder: your appointment with {{businessName}} is on {{scheduledAt}}. Reply STOP to opt out.", locale: "en" },
  { key: "appointment.confirmed", channel: "email",    subject: "Appointment Confirmed", body: "Hi {{customerName}},\n\nYour appointment with {{businessName}} is confirmed for {{scheduledAt}}.\n\nSee you then!", locale: "en" },
  { key: "appointment.cancelled", channel: "email",    subject: "Appointment Cancelled", body: "Hi {{customerName}},\n\nYour appointment on {{scheduledAt}} has been cancelled. Please contact us to reschedule.", locale: "en" },
  // Job
  { key: "job.started",           channel: "sms",      body: "Hi {{customerName}}, {{technicianName}} is on the way for your {{jobTitle}} service.", locale: "en" },
  { key: "job.completed",         channel: "sms",      body: "Hi {{customerName}}, your {{jobTitle}} service is complete. Thank you for choosing {{businessName}}!", locale: "en" },
  // Invoice
  { key: "invoice.sent",          channel: "email",    subject: "Invoice #{{invoiceNumber}} from {{businessName}}", body: "Hi {{customerName}},\n\nPlease find attached your invoice for ${{amountDollars}}.\n\nDue date: {{dueDate}}\n\nThank you!", locale: "en" },
  { key: "invoice.overdue",       channel: "email",    subject: "Payment Overdue — Invoice #{{invoiceNumber}}", body: "Hi {{customerName}},\n\nYour invoice for ${{amountDollars}} is now overdue. Please submit payment at your earliest convenience.", locale: "en" },
  // Review
  { key: "review.request",        channel: "sms",      body: "Hi {{customerName}}, how was your experience with {{businessName}}? Leave a review: {{reviewUrl}} (Reply STOP to opt out)", locale: "en" },
  // Estimate
  { key: "estimate.sent",         channel: "email",    subject: "Estimate from {{businessName}}", body: "Hi {{customerName}},\n\nPlease review your estimate of ${{amountDollars}} at your convenience. Valid until {{validUntil}}.", locale: "en" },
  { key: "estimate.accepted",     channel: "internal", body: "Estimate {{estimateId}} accepted by {{customerName}} for {{businessName}}", locale: "en" },
  // Payment
  { key: "payment.received",      channel: "email",    subject: "Payment Received — Thank You!", body: "Hi {{customerName}},\n\nWe've received your payment of ${{amountDollars}}. Thank you for your business!", locale: "en" },
  // Staff
  { key: "staff.onboarded",       channel: "internal", body: "New staff member {{staffName}} onboarded for {{businessName}}", locale: "en" },
];

// ── Retry config ──────────────────────────────────────────────────────────────

export interface RetryConfig {
  maxAttempts: number;
  backoffMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY: RetryConfig = {
  maxAttempts: 3,
  backoffMs: 1000,
  backoffMultiplier: 2,
};

// ── Delivery record ───────────────────────────────────────────────────────────

export interface DeliveryRecord {
  deliveryId: string;
  orgId: string;
  businessId?: string;
  channel: NotificationChannel;
  recipient: string;
  templateKey?: string;
  status: "queued" | "sent" | "delivered" | "failed";
  attemptCount: number;
  errorMessage?: string;
  sentAt?: string;
  queuedAt: string;
}

// ── CommunicationService ──────────────────────────────────────────────────────

export interface CommunicationRequest {
  orgId: string;
  businessId?: string;
  /** Target channel. Default: inferred from template if templateKey provided. */
  channel?: NotificationChannel;
  recipient: string;
  /** Template key to render. Takes priority over raw body. */
  templateKey?: string;
  /** Template variables. */
  vars?: Record<string, unknown>;
  /** Raw subject (used if no template). */
  subject?: string;
  /** Raw body (used if no template). */
  body?: string;
  locale?: string;
  retry?: Partial<RetryConfig>;
  /** Escalation channel if primary fails repeatedly. */
  escalationChannel?: NotificationChannel;
  escalationRecipient?: string;
}

export interface CommunicationService {
  send(request: CommunicationRequest): Promise<DeliveryRecord>;
  /** Send using a named template, resolving body and channel automatically. */
  sendTemplate(templateKey: string, orgId: string, businessId: string, recipient: string, vars: Record<string, unknown>): Promise<DeliveryRecord>;
  /** Batch send to multiple recipients. */
  sendBatch(requests: CommunicationRequest[]): Promise<DeliveryRecord[]>;
  /** Get delivery history for an org/business. */
  deliveryHistory(orgId: string, businessId?: string, limit?: number): Promise<DeliveryRecord[]>;
  /** Register a custom template. */
  registerTemplate(template: NotificationTemplate): void;
  /** List all available templates. */
  listTemplates(): NotificationTemplate[];
}

export function createCommunicationService(
  notificationService: NotificationService,
  eventBus: EventBus,
): CommunicationService {
  const customTemplates = new Map<string, NotificationTemplate>();
  const deliveryLog: DeliveryRecord[] = [];

  function findTemplate(key: string, locale = "en"): NotificationTemplate | undefined {
    return customTemplates.get(`${key}:${locale}`)
      ?? customTemplates.get(`${key}:en`)
      ?? BUILT_IN_TEMPLATES.find((t) => t.key === key && t.locale === locale)
      ?? BUILT_IN_TEMPLATES.find((t) => t.key === key && t.locale === "en");
  }

  async function dispatchWithRetry(
    req: NotificationRequest,
    retryConfig: RetryConfig,
    deliveryId: string,
  ): Promise<NotificationResult> {
    let lastResult: NotificationResult | null = null;
    let delay = retryConfig.backoffMs;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      lastResult = await notificationService.send(req);
      if (lastResult.status === "sent") return lastResult;

      if (attempt < retryConfig.maxAttempts) {
        await new Promise((r) => setTimeout(r, delay));
        delay *= retryConfig.backoffMultiplier;
      }
    }

    return lastResult!;
  }

  async function executeSend(request: CommunicationRequest): Promise<DeliveryRecord> {
    const deliveryId = randomUUID();
    const queuedAt = new Date().toISOString();
    const retryConfig: RetryConfig = { ...DEFAULT_RETRY, ...request.retry };

    // Resolve template
    let channel = request.channel;
    let body = request.body ?? "";
    let subject = request.subject;

    if (request.templateKey) {
      const tmpl = findTemplate(request.templateKey, request.locale);
      if (tmpl) {
        const vars = request.vars ?? {};
        channel = channel ?? tmpl.channel;
        body = renderTemplate(tmpl.body, vars);
        subject = subject ?? (tmpl.subject ? renderTemplate(tmpl.subject, vars) : undefined);
      }
    }

    if (!channel) throw new Error("Communication channel is required");
    if (!body) throw new Error("Notification body is required");

    const record: DeliveryRecord = {
      deliveryId,
      orgId: request.orgId,
      businessId: request.businessId,
      channel,
      recipient: request.recipient,
      templateKey: request.templateKey,
      status: "queued",
      attemptCount: 0,
      queuedAt,
    };

    deliveryLog.push(record);

    // Emit queued event
    await eventBus.publish(
      createBossEvent(
        "notification.queued",
        { deliveryId, channel, recipient: request.recipient, templateKey: request.templateKey ?? null },
        { orgId: request.orgId, businessId: request.businessId, actorId: "communication-platform", requestId: deliveryId, correlationId: deliveryId, traceId: deliveryId },
      ),
    );

    const notifReq: NotificationRequest = {
      orgId: request.orgId,
      businessId: request.businessId,
      channel,
      recipient: request.recipient,
      subject,
      body,
      templateKey: request.templateKey,
    };

    const result = await dispatchWithRetry(notifReq, retryConfig, deliveryId);

    record.attemptCount = retryConfig.maxAttempts;
    record.status = result.status === "sent" ? "sent" : "failed";
    record.errorMessage = result.errorMessage ?? undefined;
    record.sentAt = result.sentAt;

    if (result.status === "sent") {
      await eventBus.publish(
        createBossEvent(
          "notification.delivered",
          { deliveryId, channel, recipient: request.recipient, templateKey: request.templateKey ?? null },
          { orgId: request.orgId, businessId: request.businessId, actorId: "communication-platform", requestId: deliveryId, correlationId: deliveryId, traceId: deliveryId },
        ),
      );
    } else {
      // Attempt escalation if configured
      if (request.escalationChannel && request.escalationRecipient) {
        const escRecord = await executeSend({
          ...request,
          channel: request.escalationChannel,
          recipient: request.escalationRecipient,
          escalationChannel: undefined,
          escalationRecipient: undefined,
          retry: { maxAttempts: 1 },
        });
        if (escRecord.status !== "sent") {
          record.status = "failed";
        }
      }

      await eventBus.publish(
        createBossEvent(
          "notification.failed",
          { deliveryId, channel, recipient: request.recipient, errorMessage: result.errorMessage ?? null },
          { orgId: request.orgId, businessId: request.businessId, actorId: "communication-platform", requestId: deliveryId, correlationId: deliveryId, traceId: deliveryId },
        ),
      );
    }

    return record;
  }

  return {
    async send(request) {
      return executeSend(request);
    },

    async sendTemplate(templateKey, orgId, businessId, recipient, vars) {
      return executeSend({ templateKey, orgId, businessId, recipient, vars });
    },

    async sendBatch(requests) {
      return Promise.all(requests.map((r) => executeSend(r)));
    },

    async deliveryHistory(orgId, businessId, limit = 50) {
      return deliveryLog
        .filter((d) => d.orgId === orgId && (!businessId || d.businessId === businessId))
        .slice(-limit);
    },

    registerTemplate(template) {
      customTemplates.set(`${template.key}:${template.locale}`, template);
    },

    listTemplates() {
      return [
        ...BUILT_IN_TEMPLATES,
        ...[...customTemplates.values()],
      ];
    },
  };
}
