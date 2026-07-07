import type { Estimate } from "@boss/types";
import { createBossEvent } from "@boss/events";
import type { RepositoryContainer } from "../container.js";
import { ApiError } from "../http/apiError.js";

export interface EstimateLineItem {
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

export interface EstimateService {
  create(
    orgId: string,
    businessId: string,
    input: {
      customerId?: string | null;
      estimateNumber: string;
      lineItems: EstimateLineItem[];
      taxCents?: number;
      discountCents?: number;
      taxRate?: number;
      discountRate?: number;
      currency?: string;
      validUntil?: string | null;
      notes?: string | null;
    },
    actorId: string,
  ): Promise<Estimate>;

  get(orgId: string, id: string): Promise<Estimate>;
  list(orgId: string, businessId: string): Promise<Estimate[]>;

  update(
    orgId: string,
    id: string,
    patch: Partial<{
      customerId: string | null;
      lineItems: EstimateLineItem[];
      taxCents: number;
      discountCents: number;
      taxRate: number;
      discountRate: number;
      validUntil: string | null;
      notes: string | null;
    }>,
    actorId: string,
  ): Promise<Estimate>;

  send(orgId: string, id: string, actorId: string): Promise<Estimate>;
  accept(orgId: string, id: string, actorId: string): Promise<Estimate>;
  decline(orgId: string, id: string, actorId: string): Promise<Estimate>;
  convert(orgId: string, id: string, invoiceId: string, actorId: string): Promise<Estimate>;
  delete(orgId: string, id: string, actorId: string): Promise<void>;

  /** Transition sent→viewed when customer opens the estimate link */
  markViewed(orgId: string, id: string): Promise<Estimate>;
  /** Scan all sent/viewed estimates for the business past their validUntil and expire them */
  checkExpiry(orgId: string, businessId: string): Promise<{ expired: number }>;
}

function computeTotals(
  lineItems: EstimateLineItem[],
  taxCents: number,
  discountCents: number,
  taxRate?: number,
  discountRate?: number,
) {
  const subtotalCents = lineItems.reduce((sum, li) => sum + li.totalCents, 0);
  const resolvedTaxCents =
    taxRate !== undefined ? Math.round(subtotalCents * (taxRate / 100)) : taxCents;
  const resolvedDiscountCents =
    discountRate !== undefined ? Math.round(subtotalCents * (discountRate / 100)) : discountCents;
  const totalCents = Math.max(0, subtotalCents + resolvedTaxCents - resolvedDiscountCents);
  return { subtotalCents, totalCents, taxCents: resolvedTaxCents, discountCents: resolvedDiscountCents };
}

export function createEstimateService(repos: RepositoryContainer): EstimateService {
  return {
    async create(orgId, businessId, input, actorId) {
      const existing = await repos.estimates.findByNumber(orgId, input.estimateNumber);
      if (existing) throw new ApiError(409, "ESTIMATE_NUMBER_TAKEN", `Estimate number ${input.estimateNumber} already exists`);

      const taxCents = input.taxCents ?? 0;
      const discountCents = input.discountCents ?? 0;
      const { subtotalCents, totalCents, taxCents: resolvedTax, discountCents: resolvedDiscount } =
        computeTotals(input.lineItems, taxCents, discountCents, input.taxRate, input.discountRate);

      const estimate = await repos.estimates.create({
        orgId,
        businessId,
        customerId: input.customerId ?? null,
        estimateNumber: input.estimateNumber,
        status: "draft",
        lineItems: input.lineItems,
        subtotalCents,
        taxCents: resolvedTax,
        discountCents: resolvedDiscount,
        totalCents,
        currency: input.currency ?? "USD",
        validUntil: input.validUntil ?? null,
        convertedInvoiceId: null,
        notes: input.notes ?? null,
      });

      await repos.eventBus.publish(
        createBossEvent(
          "estimate.created",
          { estimateId: estimate.id, businessId, totalCents },
          { orgId, businessId, actorId, requestId: estimate.id, correlationId: estimate.id, traceId: estimate.id },
        ),
      );

      return estimate;
    },

    async get(orgId, id) {
      const est = await repos.estimates.findById(orgId, id);
      if (!est) throw new ApiError(404, "ESTIMATE_NOT_FOUND", `Estimate ${id} not found`);
      return est;
    },

    async list(orgId, businessId) {
      return repos.estimates.listByBusinessId(orgId, businessId);
    },

    async update(orgId, id, patch, _actorId) {
      const existing = await repos.estimates.findById(orgId, id);
      if (!existing) throw new ApiError(404, "ESTIMATE_NOT_FOUND", `Estimate ${id} not found`);
      if (existing.status !== "draft") throw new ApiError(409, "ESTIMATE_NOT_EDITABLE", "Only draft estimates can be edited");

      const lineItems = patch.lineItems ?? existing.lineItems;
      const baseTaxCents = patch.taxCents ?? existing.taxCents;
      const baseDiscountCents = patch.discountCents ?? existing.discountCents;
      const { subtotalCents, totalCents, taxCents, discountCents } = computeTotals(
        lineItems,
        baseTaxCents,
        baseDiscountCents,
        patch.taxRate,
        patch.discountRate,
      );

      const { taxRate: _taxRate, discountRate: _discountRate, ...restPatch } = patch;
      void _taxRate; void _discountRate;
      return repos.estimates.update(orgId, id, { ...restPatch, lineItems, subtotalCents, taxCents, discountCents, totalCents });
    },

    async send(orgId, id, actorId) {
      const est = await repos.estimates.findById(orgId, id);
      if (!est) throw new ApiError(404, "ESTIMATE_NOT_FOUND", `Estimate ${id} not found`);
      if (est.status !== "draft") throw new ApiError(409, "ESTIMATE_INVALID_STATUS", "Only draft estimates can be sent");

      const updated = await repos.estimates.update(orgId, id, { status: "sent" });

      await repos.eventBus.publish(
        createBossEvent(
          "estimate.sent",
          { estimateId: id, customerId: est.customerId },
          { orgId, businessId: est.businessId, actorId, requestId: id, correlationId: id, traceId: id },
        ),
      );

      return updated;
    },

    async accept(orgId, id, actorId) {
      const est = await repos.estimates.findById(orgId, id);
      if (!est) throw new ApiError(404, "ESTIMATE_NOT_FOUND", `Estimate ${id} not found`);
      if (!["sent", "viewed"].includes(est.status)) throw new ApiError(409, "ESTIMATE_INVALID_STATUS", "Estimate cannot be accepted in its current status");

      const updated = await repos.estimates.update(orgId, id, { status: "accepted" });

      await repos.eventBus.publish(
        createBossEvent(
          "estimate.accepted",
          { estimateId: id, totalCents: est.totalCents },
          { orgId, businessId: est.businessId, actorId, requestId: id, correlationId: id, traceId: id },
        ),
      );

      return updated;
    },

    async decline(orgId, id, actorId) {
      const est = await repos.estimates.findById(orgId, id);
      if (!est) throw new ApiError(404, "ESTIMATE_NOT_FOUND", `Estimate ${id} not found`);

      const updated = await repos.estimates.update(orgId, id, { status: "declined" });

      await repos.eventBus.publish(
        createBossEvent(
          "estimate.declined",
          { estimateId: id },
          { orgId, businessId: est.businessId, actorId, requestId: id, correlationId: id, traceId: id },
        ),
      );

      return updated;
    },

    async convert(orgId, id, invoiceId, actorId) {
      const est = await repos.estimates.findById(orgId, id);
      if (!est) throw new ApiError(404, "ESTIMATE_NOT_FOUND", `Estimate ${id} not found`);
      if (est.status !== "accepted") throw new ApiError(409, "ESTIMATE_INVALID_STATUS", "Only accepted estimates can be converted to invoices");

      const updated = await repos.estimates.update(orgId, id, { status: "converted", convertedInvoiceId: invoiceId });

      await repos.eventBus.publish(
        createBossEvent(
          "estimate.converted",
          { estimateId: id, invoiceId },
          { orgId, businessId: est.businessId, actorId, requestId: id, correlationId: id, traceId: id },
        ),
      );

      return updated;
    },

    async delete(orgId, id, actorId) {
      const est = await repos.estimates.findById(orgId, id);
      if (!est) throw new ApiError(404, "ESTIMATE_NOT_FOUND", `Estimate ${id} not found`);
      if (!["draft", "declined", "expired"].includes(est.status)) {
        throw new ApiError(409, "ESTIMATE_NOT_DELETABLE", "Only draft, declined, or expired estimates can be deleted");
      }

      await repos.estimates.delete(orgId, id);

      await repos.eventBus.publish(
        createBossEvent(
          "estimate.deleted",
          { estimateId: id },
          { orgId, businessId: est.businessId, actorId, requestId: id, correlationId: id, traceId: id },
        ),
      );
    },

    async markViewed(orgId, id) {
      const est = await repos.estimates.findById(orgId, id);
      if (!est) throw new ApiError(404, "ESTIMATE_NOT_FOUND", `Estimate ${id} not found`);
      if (est.status !== "sent") {
        throw new ApiError(409, "ESTIMATE_INVALID_STATUS", "Only sent estimates can be marked as viewed");
      }

      const updated = await repos.estimates.update(orgId, id, { status: "viewed" });

      await repos.eventBus.publish(
        createBossEvent(
          "estimate.viewed",
          { estimateId: id, customerId: est.customerId },
          { orgId, businessId: est.businessId, actorId: "customer", requestId: id, correlationId: id, traceId: id },
        ),
      );

      return updated;
    },

    async checkExpiry(orgId, businessId) {
      const estimates = await repos.estimates.listByBusinessId(orgId, businessId);
      const now = new Date().toISOString();
      let expired = 0;

      for (const est of estimates) {
        if (
          ["sent", "viewed"].includes(est.status) &&
          est.validUntil !== null &&
          est.validUntil < now
        ) {
          await repos.estimates.update(orgId, est.id, { status: "expired" });
          await repos.eventBus.publish(
            createBossEvent(
              "estimate.expired",
              { estimateId: est.id, businessId, validUntil: est.validUntil },
              { orgId, businessId, actorId: "system", requestId: est.id, correlationId: est.id, traceId: est.id },
            ),
          );
          expired++;
        }
      }

      return { expired };
    },
  };
}
