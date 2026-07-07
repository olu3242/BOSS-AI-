/**
 * Pricing Engine Service — Wave 2 Revenue OS
 * In-memory rule-based pricing: price rules → discounts → taxes.
 */
import { randomUUID } from "node:crypto";
import { createBossEvent, type EventBus } from "@boss/events";

export interface PriceRule {
  id: string;
  key: string;
  label: string;
  type: "flat" | "percentage" | "tiered" | "subscription";
  baseAmountCents?: number;
  percentage?: number;
  tiers?: Array<{ upTo: number | null; pricePerUnitCents: number }>;
  conditions?: Array<{ field: string; operator: string; value: unknown }>;
  priority: number;
  active: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface DiscountRule {
  id: string;
  code?: string;
  label: string;
  type: "percentage" | "flat";
  value: number; // percent 0-100 or cents
  conditions?: Array<{ field: string; operator: string; value: unknown }>;
  maxUses?: number | null;
  usedCount: number;
  expiresAt?: string | null;
  active: boolean;
}

export interface TaxRule {
  id: string;
  key: string;
  label: string;
  rate: number; // 0-100 percentage
  region?: string;
  category?: string;
  inclusive: boolean;
  active: boolean;
}

export interface PricingContext {
  orgId: string;
  businessId: string;
  items: Array<{ key: string; quantity: number; basePriceCents: number; category?: string }>;
  couponCode?: string;
  region?: string;
  customerId?: string;
}

export interface PricingResult {
  items: Array<{ key: string; quantity: number; unitPriceCents: number; totalCents: number; appliedRules: string[] }>;
  subtotalCents: number;
  discountCents: number;
  discountDetails: Array<{ label: string; amountCents: number }>;
  taxCents: number;
  taxDetails: Array<{ label: string; rate: number; amountCents: number }>;
  totalCents: number;
  appliedCoupon?: string;
  marginCents?: number;
}

export interface PricingEngineService {
  addPriceRule(orgId: string, businessId: string, rule: Omit<PriceRule, "id">): Promise<PriceRule>;
  addDiscountRule(orgId: string, businessId: string, rule: Omit<DiscountRule, "id" | "usedCount">): Promise<DiscountRule>;
  addTaxRule(orgId: string, businessId: string, rule: Omit<TaxRule, "id">): Promise<TaxRule>;
  calculate(context: PricingContext): Promise<PricingResult>;
  validateCoupon(orgId: string, businessId: string, code: string): Promise<DiscountRule | null>;
  listRules(orgId: string, businessId: string): Promise<{ priceRules: PriceRule[]; discountRules: DiscountRule[]; taxRules: TaxRule[] }>;
}

function makeKey(orgId: string, businessId: string) {
  return `${orgId}::${businessId}`;
}

export function createPricingEngineService(eventBus: EventBus): PricingEngineService {
  const priceRulesStore = new Map<string, PriceRule[]>();
  const discountRulesStore = new Map<string, DiscountRule[]>();
  const taxRulesStore = new Map<string, TaxRule[]>();

  function getPriceRules(orgId: string, businessId: string): PriceRule[] {
    return priceRulesStore.get(makeKey(orgId, businessId)) ?? [];
  }
  function getDiscountRules(orgId: string, businessId: string): DiscountRule[] {
    return discountRulesStore.get(makeKey(orgId, businessId)) ?? [];
  }
  function getTaxRules(orgId: string, businessId: string): TaxRule[] {
    return taxRulesStore.get(makeKey(orgId, businessId)) ?? [];
  }

  function resolveTieredPrice(tiers: Array<{ upTo: number | null; pricePerUnitCents: number }>, quantity: number): number {
    const sorted = [...tiers].sort((a, b) => (a.upTo ?? Infinity) - (b.upTo ?? Infinity));
    for (const tier of sorted) {
      if (tier.upTo === null || quantity <= tier.upTo) {
        return tier.pricePerUnitCents;
      }
    }
    const last = sorted[sorted.length - 1];
    return last?.pricePerUnitCents ?? 0;
  }

  function applyPriceRules(
    itemKey: string,
    quantity: number,
    basePriceCents: number,
    rules: PriceRule[],
    now: string,
  ): { unitPriceCents: number; appliedRules: string[] } {
    const applicable = rules
      .filter((r) => r.active)
      .filter((r) => !r.effectiveFrom || r.effectiveFrom <= now)
      .filter((r) => !r.effectiveTo || r.effectiveTo >= now)
      .sort((a, b) => a.priority - b.priority);

    let unitPrice = basePriceCents;
    const appliedRules: string[] = [];

    for (const rule of applicable) {
      if (rule.type === "flat" && rule.baseAmountCents !== undefined) {
        unitPrice = rule.baseAmountCents;
        appliedRules.push(rule.id);
      } else if (rule.type === "percentage" && rule.percentage !== undefined) {
        unitPrice = Math.round(basePriceCents * (1 + rule.percentage / 100));
        appliedRules.push(rule.id);
      } else if (rule.type === "tiered" && rule.tiers) {
        unitPrice = resolveTieredPrice(rule.tiers, quantity);
        appliedRules.push(rule.id);
      } else if (rule.type === "subscription" && rule.baseAmountCents !== undefined) {
        unitPrice = rule.baseAmountCents;
        appliedRules.push(rule.id);
      }
    }
    void itemKey;
    return { unitPriceCents: unitPrice, appliedRules };
  }

  return {
    async addPriceRule(orgId, businessId, rule) {
      const key = makeKey(orgId, businessId);
      const newRule: PriceRule = { ...rule, id: randomUUID() };
      const existing = priceRulesStore.get(key) ?? [];
      priceRulesStore.set(key, [...existing, newRule]);
      return newRule;
    },

    async addDiscountRule(orgId, businessId, rule) {
      const key = makeKey(orgId, businessId);
      const newRule: DiscountRule = { ...rule, id: randomUUID(), usedCount: 0 };
      const existing = discountRulesStore.get(key) ?? [];
      discountRulesStore.set(key, [...existing, newRule]);
      return newRule;
    },

    async addTaxRule(orgId, businessId, rule) {
      const key = makeKey(orgId, businessId);
      const newRule: TaxRule = { ...rule, id: randomUUID() };
      const existing = taxRulesStore.get(key) ?? [];
      taxRulesStore.set(key, [...existing, newRule]);
      return newRule;
    },

    async calculate(context) {
      const { orgId, businessId, items, couponCode, region } = context;
      const now = new Date().toISOString();
      const priceRules = getPriceRules(orgId, businessId).filter((r) => r.active);
      const discountRules = getDiscountRules(orgId, businessId).filter((r) => r.active);
      const taxRules = getTaxRules(orgId, businessId).filter((r) => r.active);

      // 1. Apply price rules per item
      const resolvedItems = items.map((item) => {
        const { unitPriceCents, appliedRules } = applyPriceRules(
          item.key, item.quantity, item.basePriceCents, priceRules, now,
        );
        return {
          key: item.key,
          quantity: item.quantity,
          unitPriceCents,
          totalCents: unitPriceCents * item.quantity,
          appliedRules,
        };
      });

      const subtotalCents = resolvedItems.reduce((sum, i) => sum + i.totalCents, 0);

      // 2. Apply discounts
      let discountCents = 0;
      const discountDetails: Array<{ label: string; amountCents: number }> = [];
      let appliedCoupon: string | undefined;

      // Auto discounts (no code required)
      for (const dr of discountRules.filter((d) => !d.code)) {
        const now2 = new Date().toISOString();
        if (dr.expiresAt && dr.expiresAt < now2) continue;
        if (dr.maxUses !== null && dr.maxUses !== undefined && dr.usedCount >= dr.maxUses) continue;
        const amount = dr.type === "percentage"
          ? Math.round(subtotalCents * (dr.value / 100))
          : dr.value;
        discountCents += amount;
        discountDetails.push({ label: dr.label, amountCents: amount });
      }

      // Coupon code discount
      if (couponCode) {
        const coupon = discountRules.find((d) => d.code === couponCode);
        if (coupon) {
          const now2 = new Date().toISOString();
          if (!coupon.expiresAt || coupon.expiresAt >= now2) {
            const amount = coupon.type === "percentage"
              ? Math.round(subtotalCents * (coupon.value / 100))
              : coupon.value;
            discountCents += amount;
            discountDetails.push({ label: coupon.label, amountCents: amount });
            appliedCoupon = couponCode;
            coupon.usedCount++;
          }
        }
      }

      const afterDiscount = Math.max(0, subtotalCents - discountCents);

      // 3. Apply taxes
      let taxCents = 0;
      const taxDetails: Array<{ label: string; rate: number; amountCents: number }> = [];

      const applicableTaxRules = taxRules.filter((t) => {
        if (t.region && region && t.region !== region) return false;
        return true;
      });

      for (const tr of applicableTaxRules) {
        const base = tr.inclusive ? afterDiscount : afterDiscount;
        const amount = Math.round(base * (tr.rate / 100));
        taxCents += amount;
        taxDetails.push({ label: tr.label, rate: tr.rate, amountCents: amount });
      }

      const totalCents = afterDiscount + taxCents;

      await eventBus.publish(
        createBossEvent("pricing.calculated", { orgId, businessId, subtotalCents, discountCents, taxCents, totalCents }, {
          orgId, businessId, actorId: "system",
          requestId: randomUUID(), correlationId: randomUUID(), traceId: randomUUID(),
        }),
      );

      return {
        items: resolvedItems,
        subtotalCents,
        discountCents,
        discountDetails,
        taxCents,
        taxDetails,
        totalCents,
        appliedCoupon,
      };
    },

    async validateCoupon(orgId, businessId, code) {
      const rules = getDiscountRules(orgId, businessId);
      const coupon = rules.find((d) => d.code === code && d.active);
      if (!coupon) return null;
      const now = new Date().toISOString();
      if (coupon.expiresAt && coupon.expiresAt < now) return null;
      if (coupon.maxUses !== null && coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) return null;
      return coupon;
    },

    async listRules(orgId, businessId) {
      return {
        priceRules: getPriceRules(orgId, businessId),
        discountRules: getDiscountRules(orgId, businessId),
        taxRules: getTaxRules(orgId, businessId),
      };
    },
  };
}
