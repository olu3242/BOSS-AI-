/**
 * Collections Engine — Wave 2 Revenue OS
 * Manages overdue invoice collections: reminders, escalations, payment plans, resolution.
 */
import { randomUUID } from "node:crypto";
import { createBossEvent, type EventBus } from "@boss/events";
import type { RepositoryContainer } from "../container.js";
import type { InvoiceService } from "./invoiceService.js";

export type CollectionsStatus =
  | "pending"
  | "in_reminder"
  | "escalated"
  | "payment_plan"
  | "resolved"
  | "written_off";

export type CollectionsAction =
  | "reminder_sent"
  | "escalated"
  | "payment_plan_created"
  | "payment_received"
  | "written_off"
  | "resolved";

export interface CollectionsCase {
  id: string;
  orgId: string;
  businessId: string;
  invoiceId: string;
  customerId: string;
  status: CollectionsStatus;
  daysOverdue: number;
  amountCents: number;
  outstandingCents: number;
  riskScore: number; // 0-1
  actions: Array<{ action: CollectionsAction; performedAt: string; notes?: string }>;
  paymentPlan?: {
    installmentCents: number;
    frequencyDays: number;
    nextDueAt: string;
    remainingInstallments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CollectionsService {
  openCase(orgId: string, businessId: string, invoiceId: string): Promise<CollectionsCase>;
  getCase(orgId: string, id: string): Promise<CollectionsCase | null>;
  listCases(orgId: string, businessId: string): Promise<CollectionsCase[]>;
  sendReminder(orgId: string, caseId: string): Promise<CollectionsCase>;
  escalate(orgId: string, caseId: string, notes?: string): Promise<CollectionsCase>;
  createPaymentPlan(
    orgId: string,
    caseId: string,
    installmentCents: number,
    frequencyDays: number,
  ): Promise<CollectionsCase>;
  resolve(orgId: string, caseId: string): Promise<CollectionsCase>;
  writeOff(orgId: string, caseId: string, reason: string): Promise<CollectionsCase>;
  computeRiskScore(
    daysOverdue: number,
    amountCents: number,
    customerHistory?: { previousOverdueCount: number },
  ): number;
  runCollectionsCycle(
    orgId: string,
    businessId: string,
  ): Promise<{ newCases: number; reminders: number; escalations: number }>;
}

function nowIso() {
  return new Date().toISOString();
}

function daysOverdueFromDate(dueAt: string | null): number {
  const base = dueAt ? new Date(dueAt) : new Date();
  return Math.max(0, Math.floor((Date.now() - base.getTime()) / (1000 * 60 * 60 * 24)));
}

export function createCollectionsService(
  repos: RepositoryContainer,
  invoiceService: InvoiceService,
  eventBus: EventBus,
): CollectionsService {
  const cases = new Map<string, CollectionsCase>();

  function byInvoiceId(orgId: string, invoiceId: string): CollectionsCase | undefined {
    for (const c of cases.values()) {
      if (c.orgId === orgId && c.invoiceId === invoiceId) return c;
    }
    return undefined;
  }

  function requireCase(orgId: string, caseId: string): CollectionsCase {
    const c = cases.get(caseId);
    if (!c || c.orgId !== orgId) throw new Error(`Collections case ${caseId} not found`);
    return c;
  }

  const computeRiskScore = (
    daysOverdue: number,
    amountCents: number,
    customerHistory?: { previousOverdueCount: number },
  ): number =>
    Math.min(
      1,
      (daysOverdue / 90) * 0.6 +
        (customerHistory?.previousOverdueCount ?? 0) * 0.2 +
        Math.min(0.2, amountCents / 1_000_000),
    );

  async function openCase(orgId: string, businessId: string, invoiceId: string): Promise<CollectionsCase> {
    const existing = byInvoiceId(orgId, invoiceId);
    if (existing) return existing;

    const invoice = await repos.invoices.findById(orgId, invoiceId);
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

    const daysOverdue = daysOverdueFromDate(invoice.dueAt);
    const riskScore = computeRiskScore(daysOverdue, invoice.totalCents);

    const c: CollectionsCase = {
      id: randomUUID(),
      orgId,
      businessId,
      invoiceId,
      customerId: invoice.customerId,
      status: "pending",
      daysOverdue,
      amountCents: invoice.totalCents,
      outstandingCents: invoice.totalCents,
      riskScore,
      actions: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    cases.set(c.id, c);

    await eventBus.publish(
      createBossEvent(
        "collections.case.opened",
        { caseId: c.id, invoiceId, businessId, amountCents: c.amountCents },
        { orgId, businessId, actorId: "system", requestId: c.id, correlationId: c.id, traceId: c.id },
      ),
    );

    return c;
  }

  async function sendReminder(orgId: string, caseId: string): Promise<CollectionsCase> {
    const c = requireCase(orgId, caseId);
    const updated: CollectionsCase = {
      ...c,
      status: "in_reminder",
      actions: [...c.actions, { action: "reminder_sent", performedAt: nowIso() }],
      updatedAt: nowIso(),
    };
    cases.set(caseId, updated);
    await eventBus.publish(
      createBossEvent(
        "collections.reminder.sent",
        { caseId, invoiceId: c.invoiceId, customerId: c.customerId },
        { orgId, businessId: c.businessId, actorId: "system", requestId: caseId, correlationId: caseId, traceId: caseId },
      ),
    );
    return updated;
  }

  async function escalate(orgId: string, caseId: string, notes?: string): Promise<CollectionsCase> {
    const c = requireCase(orgId, caseId);
    const updated: CollectionsCase = {
      ...c,
      status: "escalated",
      actions: [...c.actions, { action: "escalated", performedAt: nowIso(), notes }],
      updatedAt: nowIso(),
    };
    cases.set(caseId, updated);
    await eventBus.publish(
      createBossEvent(
        "collections.case.escalated",
        { caseId, invoiceId: c.invoiceId, notes: notes ?? null },
        { orgId, businessId: c.businessId, actorId: "system", requestId: caseId, correlationId: caseId, traceId: caseId },
      ),
    );
    return updated;
  }

  return {
    openCase,
    sendReminder,
    escalate,
    computeRiskScore,

    async getCase(orgId, id) {
      const c = cases.get(id);
      if (!c || c.orgId !== orgId) return null;
      return c;
    },

    async listCases(orgId, businessId) {
      return [...cases.values()].filter((c) => c.orgId === orgId && c.businessId === businessId);
    },

    async createPaymentPlan(orgId, caseId, installmentCents, frequencyDays) {
      const c = requireCase(orgId, caseId);
      const remainingInstallments = Math.ceil(c.outstandingCents / installmentCents);
      const nextDueAt = new Date(Date.now() + frequencyDays * 24 * 60 * 60 * 1000).toISOString();
      const updated: CollectionsCase = {
        ...c,
        status: "payment_plan",
        paymentPlan: { installmentCents, frequencyDays, nextDueAt, remainingInstallments },
        actions: [...c.actions, { action: "payment_plan_created", performedAt: nowIso() }],
        updatedAt: nowIso(),
      };
      cases.set(caseId, updated);
      return updated;
    },

    async resolve(orgId, caseId) {
      const c = requireCase(orgId, caseId);
      const updated: CollectionsCase = {
        ...c,
        status: "resolved",
        outstandingCents: 0,
        actions: [...c.actions, { action: "resolved", performedAt: nowIso() }],
        updatedAt: nowIso(),
      };
      cases.set(caseId, updated);
      return updated;
    },

    async writeOff(orgId, caseId, reason) {
      const c = requireCase(orgId, caseId);
      const updated: CollectionsCase = {
        ...c,
        status: "written_off",
        actions: [...c.actions, { action: "written_off", performedAt: nowIso(), notes: reason }],
        updatedAt: nowIso(),
      };
      cases.set(caseId, updated);
      return updated;
    },

    async runCollectionsCycle(orgId, businessId) {
      await invoiceService.markOverdue(orgId, businessId);
      const overdueInvoices = await invoiceService.listOverdue(orgId, businessId);

      let newCases = 0;
      let reminders = 0;
      let escalations = 0;

      for (const inv of overdueInvoices) {
        const daysOverdue = daysOverdueFromDate(inv.dueAt);
        let c = byInvoiceId(orgId, inv.id);

        if (!c) {
          c = await openCase(orgId, businessId, inv.id);
          newCases++;
        }

        const caseId = c.id;
        const refreshed = cases.get(caseId);
        if (!refreshed) continue;

        if (daysOverdue >= 1 && daysOverdue <= 14 && refreshed.status === "pending") {
          await sendReminder(orgId, caseId);
          reminders++;
        } else if (
          daysOverdue >= 15 &&
          daysOverdue <= 30 &&
          refreshed.status !== "escalated" &&
          refreshed.status !== "written_off" &&
          refreshed.status !== "resolved"
        ) {
          await escalate(orgId, caseId, `Auto-escalated after ${daysOverdue} days overdue`);
          escalations++;
        }
      }

      return { newCases, reminders, escalations };
    },
  };
}
