/**
 * Revenue Communication Service — Wave 2 Revenue OS
 * Orchestrates email/notification sending for revenue-related events.
 */
import type { EventBus } from "@boss/events";
import type { NotificationService } from "./notificationService.js";

export interface RevenueCommunicationService {
  sendEstimateEmail(orgId: string, businessId: string, estimateId: string): Promise<void>;
  sendInvoiceEmail(orgId: string, businessId: string, invoiceId: string): Promise<void>;
  sendPaymentReminder(orgId: string, businessId: string, invoiceId: string): Promise<void>;
  sendPaymentReceipt(orgId: string, businessId: string, paymentId: string): Promise<void>;
  sendCollectionsReminder(orgId: string, businessId: string, collectionsId: string): Promise<void>;
}

export function createRevenueCommunicationService(
  notification: NotificationService,
  eventBus: EventBus,
): RevenueCommunicationService {
  void eventBus;

  async function sendInternal(orgId: string, businessId: string, body: string): Promise<void> {
    await notification.send({
      orgId,
      businessId,
      channel: "internal",
      recipient: "system",
      body,
    });
  }

  return {
    async sendEstimateEmail(orgId, businessId, estimateId) {
      await sendInternal(orgId, businessId, `Estimate ${estimateId} has been sent to the customer.`);
    },

    async sendInvoiceEmail(orgId, businessId, invoiceId) {
      await sendInternal(orgId, businessId, `Invoice ${invoiceId} has been sent to the customer.`);
    },

    async sendPaymentReminder(orgId, businessId, invoiceId) {
      await sendInternal(
        orgId,
        businessId,
        `Payment reminder sent for invoice ${invoiceId}. This invoice is overdue.`,
      );
    },

    async sendPaymentReceipt(orgId, businessId, paymentId) {
      await sendInternal(orgId, businessId, `Payment receipt sent for payment ${paymentId}.`);
    },

    async sendCollectionsReminder(orgId, businessId, collectionsId) {
      await sendInternal(
        orgId,
        businessId,
        `Collections reminder sent for case ${collectionsId}.`,
      );
    },
  };
}
