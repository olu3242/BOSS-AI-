import type { Payment, PaymentMethod, PaymentStatus } from "@boss/types";
import { createBossEvent } from "@boss/events";
import type { RepositoryContainer } from "../container.js";

export interface PaymentService {
  createPayment(orgId: string, businessId: string, input: {
    customerId: string;
    invoiceId: string;
    amountCents: number;
    currency?: string;
    method: PaymentMethod;
    reference?: string | null;
    notes?: string | null;
    paidAt?: string | null;
  }): Promise<Payment>;

  getPayment(orgId: string, paymentId: string): Promise<Payment>;

  updateStatus(orgId: string, paymentId: string, status: PaymentStatus): Promise<Payment>;

  listByBusiness(orgId: string, businessId: string): Promise<Payment[]>;

  /** Create a refund record for a payment */
  refundPayment(orgId: string, paymentId: string, amountCents: number, reason?: string): Promise<Payment>;
  /** List all payments for a given invoice */
  listByInvoice(orgId: string, invoiceId: string): Promise<Payment[]>;
  /** List all payments for a given customer (scanned via invoices) */
  listByCustomer(orgId: string, customerId: string): Promise<Payment[]>;
  /** Record a partial payment; auto-marks invoice paid when fully covered */
  recordPartialPayment(
    orgId: string,
    businessId: string,
    input: { invoiceId: string; amountCents: number; method: PaymentMethod; paidAt?: string; reference?: string },
  ): Promise<Payment>;
}

export function createPaymentService(repos: RepositoryContainer): PaymentService {
  return {
    async createPayment(orgId, businessId, input) {
      const payment = await repos.payments.create({
        orgId,
        businessId,
        customerId: input.customerId,
        invoiceId: input.invoiceId,
        amountCents: input.amountCents,
        currency: input.currency ?? 'USD',
        method: input.method,
        status: 'pending',
        reference: input.reference ?? null,
        notes: input.notes ?? null,
        paidAt: input.paidAt ?? null,
      });

      await repos.eventBus.publish({
        type: "payment.created",
        payload: { orgId, businessId, paymentId: payment.id, invoiceId: payment.invoiceId, amountCents: payment.amountCents },
        occurredAt: new Date().toISOString(),
      });

      return payment;
    },

    async getPayment(orgId, paymentId) {
      const p = await repos.payments.findById(orgId, paymentId);
      if (!p) throw new Error(`Payment ${paymentId} not found`);
      return p;
    },

    async updateStatus(orgId, paymentId, status) {
      const now = new Date().toISOString();
      const patch: Record<string, unknown> = { status };
      if (status === 'completed') {
        patch['paidAt'] = now;
      }

      const payment = await repos.payments.update(orgId, paymentId, patch as Parameters<typeof repos.payments.update>[2]);

      if (status === 'completed') {
        // Update the linked invoice to paid
        await repos.invoices.update(orgId, payment.invoiceId, {
          status: 'paid',
          paidAt: now,
        });

        await repos.eventBus.publish({
          type: "payment.received",
          payload: { orgId, paymentId: payment.id, invoiceId: payment.invoiceId, amountCents: payment.amountCents },
          occurredAt: now,
        });
      }

      return payment;
    },

    async listByBusiness(orgId, businessId) {
      return repos.payments.listByBusiness(orgId, businessId);
    },

    async refundPayment(orgId, paymentId, amountCents, reason) {
      const payment = await repos.payments.findById(orgId, paymentId);
      if (!payment) throw new Error(`Payment ${paymentId} not found`);
      const now = new Date().toISOString();
      const updated = await repos.payments.update(orgId, paymentId, {
        status: "refunded" as PaymentStatus,
        notes: reason ?? payment.notes,
      });
      await repos.eventBus.publish(
        createBossEvent("payment.refunded", { paymentId, invoiceId: payment.invoiceId, amountCents, reason: reason ?? null }, {
          orgId, businessId: payment.businessId, actorId: "system",
          requestId: paymentId, correlationId: paymentId, traceId: paymentId,
        }),
      );
      void now;
      return updated;
    },

    async listByInvoice(orgId, invoiceId) {
      return repos.payments.listByInvoice(orgId, invoiceId);
    },

    async listByCustomer(orgId, customerId) {
      const invoices = await repos.invoices.listByCustomer(orgId, customerId);
      const paymentArrays = await Promise.all(
        invoices.map((inv) => repos.payments.listByInvoice(orgId, inv.id)),
      );
      return paymentArrays.flat();
    },

    async recordPartialPayment(orgId, businessId, input) {
      const now = new Date().toISOString();
      const payment = await repos.payments.create({
        orgId,
        businessId,
        customerId: "", // will be resolved below
        invoiceId: input.invoiceId,
        amountCents: input.amountCents,
        currency: "USD",
        method: input.method,
        status: "completed",
        reference: input.reference ?? null,
        notes: null,
        paidAt: input.paidAt ?? now,
      });

      await repos.eventBus.publish(
        createBossEvent("payment.partial_received", { paymentId: payment.id, invoiceId: input.invoiceId, amountCents: input.amountCents }, {
          orgId, businessId, actorId: "system",
          requestId: payment.id, correlationId: payment.id, traceId: payment.id,
        }),
      );

      // Check if invoice is fully paid
      const invoice = await repos.invoices.findById(orgId, input.invoiceId);
      if (invoice) {
        const allPayments = await repos.payments.listByInvoice(orgId, input.invoiceId);
        const totalPaid = allPayments
          .filter((p) => p.status === "completed")
          .reduce((sum, p) => sum + p.amountCents, 0);

        if (totalPaid >= invoice.totalCents && invoice.status !== "paid") {
          await repos.invoices.update(orgId, input.invoiceId, { status: "paid", paidAt: now, paymentMethod: input.method });
          await repos.eventBus.publish({
            type: "invoice.paid",
            payload: { orgId, invoiceId: input.invoiceId, paidAt: now },
            occurredAt: now,
          });
        }
      }

      return payment;
    },
  };
}
