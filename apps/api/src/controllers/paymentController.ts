import type { PaymentService } from "../services/paymentService.js";
import type { PaymentStatus } from "@boss/types";

export function createPaymentController(service: PaymentService) {
  return {
    list: (orgId: string, businessId: string) => service.listByBusiness(orgId, businessId),
    get: (orgId: string, paymentId: string) => service.getPayment(orgId, paymentId),
    create: (orgId: string, businessId: string, input: Parameters<PaymentService["createPayment"]>[2]) =>
      service.createPayment(orgId, businessId, input),
    updateStatus: (orgId: string, paymentId: string, status: PaymentStatus) =>
      service.updateStatus(orgId, paymentId, status),
    refundPayment: (orgId: string, paymentId: string, amountCents: number, reason?: string) =>
      service.refundPayment(orgId, paymentId, amountCents, reason),
    listByInvoice: (orgId: string, invoiceId: string) =>
      service.listByInvoice(orgId, invoiceId),
  };
}
