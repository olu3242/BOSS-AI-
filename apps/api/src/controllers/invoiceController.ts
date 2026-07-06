import type { InvoiceService } from "../services/invoiceService.js";

export function createInvoiceController(service: InvoiceService) {
  return {
    list: (orgId: string, businessId: string) => service.listByBusiness(orgId, businessId),
    get: (orgId: string, invoiceId: string) => service.getInvoice(orgId, invoiceId),
    create: (orgId: string, businessId: string, input: Parameters<InvoiceService["createInvoice"]>[2]) =>
      service.createInvoice(orgId, businessId, input),
    update: (orgId: string, invoiceId: string, patch: Parameters<InvoiceService["updateInvoice"]>[2]) =>
      service.updateInvoice(orgId, invoiceId, patch),
    send: (orgId: string, invoiceId: string) => service.sendInvoice(orgId, invoiceId),
    markPaid: (orgId: string, invoiceId: string, paymentMethod?: string) =>
      service.markPaid(orgId, invoiceId, paymentMethod),
    delete: (orgId: string, invoiceId: string) => service.deleteInvoice(orgId, invoiceId),
    markViewed: (orgId: string, invoiceId: string) => service.markViewed(orgId, invoiceId),
    cancel: (orgId: string, invoiceId: string, reason?: string) => service.cancel(orgId, invoiceId, reason),
    refund: (orgId: string, invoiceId: string, amountCents: number, reason?: string) =>
      service.refund(orgId, invoiceId, amountCents, reason),
    listOverdue: (orgId: string, businessId: string) => service.listOverdue(orgId, businessId),
  };
}
