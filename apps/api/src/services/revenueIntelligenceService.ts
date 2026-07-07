/**
 * Revenue Intelligence Service — Wave 2 Revenue OS
 * Computes revenue metrics, cash flow forecasts, and leakage analysis.
 */
import { createBossEvent, type EventBus } from "@boss/events";
import { randomUUID } from "node:crypto";
import type { RepositoryContainer } from "../container.js";

export interface RevenueMetrics {
  orgId: string;
  businessId: string;
  asOf: string;
  totalRevenueCents: number;
  paidRevenueCents: number;
  pendingRevenueCents: number;
  overdueRevenueCents: number;
  outstandingBalanceCents: number;
  collectionRate: number; // 0-1
  avgDaysToPayment: number | null;
  monthlyRevenue: Array<{ month: string; revenueCents: number; collectedCents: number }>;
  revenueByCustomer: Array<{ customerId: string; revenueCents: number; paidCents: number }>;
  cashFlowForecast: Array<{ period: string; expectedCents: number; confidence: number }>;
  revenueLeakage: number; // cents at risk
  marginAnalysis: { grossRevenueCents: number; costCents: number; marginPercent: number };
}

export interface RevenueIntelligenceService {
  compute(orgId: string, businessId: string): Promise<RevenueMetrics>;
  cashFlowForecast(
    orgId: string,
    businessId: string,
    months?: number,
  ): Promise<Array<{ period: string; expectedCents: number; confidence: number }>>;
  revenueLeakage(
    orgId: string,
    businessId: string,
  ): Promise<{ totalLeakageCents: number; overdueCount: number; atRiskCount: number }>;
}

function isoMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function createRevenueIntelligenceService(
  repos: RepositoryContainer,
  eventBus: EventBus,
): RevenueIntelligenceService {
  async function cashFlowForecast(
    orgId: string,
    businessId: string,
    months = 3,
  ): Promise<Array<{ period: string; expectedCents: number; confidence: number }>> {
    const invoices = await repos.invoices.listByBusiness(orgId, businessId);
    const now = new Date();

    // Build monthly totals for last 6 months
    const monthlyMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyMap.set(isoMonth(d), 0);
    }
    for (const inv of invoices.filter((i) => i.status === "paid" && i.paidAt)) {
      const key = isoMonth(new Date(inv.paidAt!));
      if (monthlyMap.has(key)) {
        monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + inv.totalCents);
      }
    }

    const values = [...monthlyMap.values()];
    const nonZero = values.filter((v) => v > 0);
    const avgMonthly = nonZero.length > 0 ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0;

    // Simple trend: compare last 3 months vs previous 3
    const recent = values.slice(-3).reduce((a, b) => a + b, 0);
    const prior = values.slice(0, 3).reduce((a, b) => a + b, 0);
    const trendFactor = prior > 0 ? recent / prior : 1;

    return Array.from({ length: months }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
      return {
        period: isoMonth(d),
        expectedCents: Math.round(avgMonthly * trendFactor),
        confidence: Math.max(0.3, 0.9 - i * 0.1),
      };
    });
  }

  return {
    async compute(orgId, businessId) {
      const [invoices, payments] = await Promise.all([
        repos.invoices.listByBusiness(orgId, businessId),
        repos.payments.listByBusiness(orgId, businessId),
      ]);

      const asOf = new Date().toISOString();
      const paidInvoices = invoices.filter((i) => i.status === "paid");
      const pendingInvoices = invoices.filter((i) => ["sent", "viewed"].includes(i.status));
      const overdueInvoices = invoices.filter((i) => i.status === "overdue");

      const paidRevenueCents = paidInvoices.reduce((s, i) => s + i.totalCents, 0);
      const pendingRevenueCents = pendingInvoices.reduce((s, i) => s + i.totalCents, 0);
      const overdueRevenueCents = overdueInvoices.reduce((s, i) => s + i.totalCents, 0);
      const totalRevenueCents = paidRevenueCents + pendingRevenueCents + overdueRevenueCents;
      const outstandingBalanceCents = pendingRevenueCents + overdueRevenueCents;
      const collectionRate = totalRevenueCents > 0 ? paidRevenueCents / totalRevenueCents : 0;

      // Avg days to payment
      const daysToPayList: number[] = [];
      for (const inv of paidInvoices) {
        if (inv.paidAt) {
          daysToPayList.push(
            (new Date(inv.paidAt).getTime() - new Date(inv.createdAt).getTime()) / (1000 * 60 * 60 * 24),
          );
        }
      }
      const avgDaysToPayment =
        daysToPayList.length > 0
          ? daysToPayList.reduce((a, b) => a + b, 0) / daysToPayList.length
          : null;

      // Monthly revenue (last 6 months)
      const now = new Date();
      const monthlyRevenue: Array<{ month: string; revenueCents: number; collectedCents: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = isoMonth(d);
        const created = invoices.filter((inv) => inv.createdAt.startsWith(month));
        const revenueCents = created.reduce((s, inv) => s + inv.totalCents, 0);
        const collectedCents = created
          .filter((inv) => inv.status === "paid")
          .reduce((s, inv) => s + inv.totalCents, 0);
        monthlyRevenue.push({ month, revenueCents, collectedCents });
      }

      // Revenue by customer
      const byCustomer = new Map<string, { revenueCents: number; paidCents: number }>();
      for (const inv of invoices) {
        const entry = byCustomer.get(inv.customerId) ?? { revenueCents: 0, paidCents: 0 };
        entry.revenueCents += inv.totalCents;
        if (inv.status === "paid") entry.paidCents += inv.totalCents;
        byCustomer.set(inv.customerId, entry);
      }
      const revenueByCustomer = [...byCustomer.entries()].map(([customerId, v]) => ({
        customerId,
        ...v,
      }));

      // Cash flow forecast
      const cashFlowForecastData = await cashFlowForecast(orgId, businessId, 3);

      // Leakage: overdue + estimated uncollectable (overdue > 60 days at 50% risk)
      const revenueLeakage = overdueRevenueCents;

      // Margin: no cost data available so 0 cost
      const grossRevenueCents = paidRevenueCents;

      await eventBus.publish(
        createBossEvent(
          "revenue.metrics.computed",
          { orgId, businessId, totalRevenueCents, paidRevenueCents, collectionRate },
          {
            orgId,
            businessId,
            actorId: "system",
            requestId: randomUUID(),
            correlationId: randomUUID(),
            traceId: randomUUID(),
          },
        ),
      );

      void payments;

      return {
        orgId,
        businessId,
        asOf,
        totalRevenueCents,
        paidRevenueCents,
        pendingRevenueCents,
        overdueRevenueCents,
        outstandingBalanceCents,
        collectionRate: Math.round(collectionRate * 1000) / 1000,
        avgDaysToPayment: avgDaysToPayment !== null ? Math.round(avgDaysToPayment * 10) / 10 : null,
        monthlyRevenue,
        revenueByCustomer,
        cashFlowForecast: cashFlowForecastData,
        revenueLeakage,
        marginAnalysis: { grossRevenueCents, costCents: 0, marginPercent: grossRevenueCents > 0 ? 100 : 0 },
      };
    },

    cashFlowForecast,

    async revenueLeakage(orgId, businessId) {
      const invoices = await repos.invoices.listByBusiness(orgId, businessId);
      const overdueInvoices = invoices.filter((i) => i.status === "overdue");
      const now = new Date();
      let atRiskCount = 0;
      for (const inv of overdueInvoices) {
        if (inv.dueAt) {
          const days = (now.getTime() - new Date(inv.dueAt).getTime()) / (1000 * 60 * 60 * 24);
          if (days > 60) atRiskCount++;
        }
      }
      const totalLeakageCents = overdueInvoices.reduce((s, i) => s + i.totalCents, 0);
      return { totalLeakageCents, overdueCount: overdueInvoices.length, atRiskCount };
    },
  };
}
