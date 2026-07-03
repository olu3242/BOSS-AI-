import type { Payment, PaymentMethod, PaymentStatus } from "@boss/types";
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
          type: "payment.completed",
          payload: { orgId, paymentId: payment.id, invoiceId: payment.invoiceId, amountCents: payment.amountCents },
          occurredAt: now,
        });
      }

      return payment;
    },

    async listByBusiness(orgId, businessId) {
      return repos.payments.listByBusiness(orgId, businessId);
    },
  };
}
