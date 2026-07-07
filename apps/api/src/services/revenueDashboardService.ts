/**
 * Revenue Dashboard Service — Wave 2 Revenue OS
 * Aggregates all revenue metrics into a single executive snapshot.
 */
import type { RepositoryContainer } from "../container.js";
import type { RevenueIntelligenceService } from "./revenueIntelligenceService.js";
import type { CollectionsService } from "./collectionsService.js";

export interface RevenueDashboard {
  orgId: string;
  businessId: string;
  generatedAt: string;
  revenue: {
    mtdCents: number;
    qtdCents: number;
    ytdCents: number;
    forecastCents: number;
  };
  pipeline: {
    totalValueCents: number;
    estimateCount: number;
    acceptanceRate: number;
    avgCycleDays: number | null;
  };
  invoices: {
    pendingCount: number;
    pendingCents: number;
    overdueCount: number;
    overdueCents: number;
    paidMtdCents: number;
  };
  cashFlow: {
    currentBalanceCents: number;
    forecast30dCents: number;
    forecast90dCents: number;
  };
  collections: {
    openCases: number;
    totalAtRiskCents: number;
    collectionRate: number;
  };
  kpiUpdates: Array<{
    kpiKey: string;
    label: string;
    value: number;
    trend: "up" | "down" | "flat";
  }>;
}

export interface RevenueDashboardService {
  get(orgId: string, businessId: string): Promise<RevenueDashboard>;
}

function isoMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function isoQuarterStart(d: Date): string {
  const q = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), q, 1).toISOString().slice(0, 10);
}

function isoYearStart(d: Date): string {
  return `${d.getFullYear()}-01-01`;
}

export function createRevenueDashboardService(
  repos: RepositoryContainer,
  revenueIntelligence: RevenueIntelligenceService,
  collectionsService: CollectionsService,
): RevenueDashboardService {
  return {
    async get(orgId, businessId) {
      const generatedAt = new Date().toISOString();
      const now = new Date();
      const mtdPrefix = isoMonth(now);
      const qtdStart = isoQuarterStart(now);
      const ytdStart = isoYearStart(now);

      const [invoices, estimates, openCases, metrics, forecast] = await Promise.all([
        repos.invoices.listByBusiness(orgId, businessId),
        repos.estimates.listByBusinessId(orgId, businessId),
        collectionsService.listCases(orgId, businessId),
        revenueIntelligence.compute(orgId, businessId),
        revenueIntelligence.cashFlowForecast(orgId, businessId, 3),
      ]);

      // Revenue bands
      const paidInvoices = invoices.filter((i) => i.status === "paid");
      const mtdCents = paidInvoices
        .filter((i) => i.paidAt && i.paidAt.startsWith(mtdPrefix))
        .reduce((s, i) => s + i.totalCents, 0);
      const qtdCents = paidInvoices
        .filter((i) => i.paidAt && i.paidAt.slice(0, 10) >= qtdStart)
        .reduce((s, i) => s + i.totalCents, 0);
      const ytdCents = paidInvoices
        .filter((i) => i.paidAt && i.paidAt.slice(0, 10) >= ytdStart)
        .reduce((s, i) => s + i.totalCents, 0);
      const forecastCents = forecast[0]?.expectedCents ?? 0;

      // Pipeline
      const openEstimates = estimates.filter((e) => ["sent", "viewed"].includes(e.status));
      const totalEstimateCount = estimates.length;
      const acceptedEstimates = estimates.filter(
        (e) => e.status === "accepted" || e.status === "converted",
      );
      const acceptanceRate =
        totalEstimateCount > 0 ? acceptedEstimates.length / totalEstimateCount : 0;

      // Avg cycle days (from createdAt to convertedInvoiceId resolution)
      const cycleDays: number[] = [];
      for (const e of acceptedEstimates) {
        if (e.convertedInvoiceId) {
          const inv = invoices.find((i) => i.id === e.convertedInvoiceId);
          if (inv) {
            cycleDays.push(
              (new Date(inv.createdAt).getTime() - new Date(e.createdAt).getTime()) /
                (1000 * 60 * 60 * 24),
            );
          }
        }
      }
      const avgCycleDays =
        cycleDays.length > 0 ? cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length : null;

      // Invoice stats
      const pendingInvoices = invoices.filter((i) => ["sent", "viewed"].includes(i.status));
      const overdueInvoices = invoices.filter((i) => i.status === "overdue");
      const paidMtdCents = mtdCents;

      // Cash flow
      const currentBalanceCents = metrics.paidRevenueCents; // simplified
      const forecast30dCents = forecast[0]?.expectedCents ?? 0;
      const forecast90dCents = forecast.reduce((s, f) => s + f.expectedCents, 0);

      // Collections
      const activeCases = openCases.filter(
        (c) => c.status !== "resolved" && c.status !== "written_off",
      );
      const totalAtRiskCents = activeCases.reduce((s, c) => s + c.outstandingCents, 0);

      // KPI updates (simplified trend based on last 2 months vs prior 2 months)
      const monthly = metrics.monthlyRevenue;
      const recentRevenue = monthly.slice(-2).reduce((s, m) => s + m.collectedCents, 0);
      const priorRevenue = monthly.slice(0, 2).reduce((s, m) => s + m.collectedCents, 0);
      const revenueTrend: "up" | "down" | "flat" =
        recentRevenue > priorRevenue * 1.05 ? "up" : recentRevenue < priorRevenue * 0.95 ? "down" : "flat";

      const kpiUpdates: RevenueDashboard["kpiUpdates"] = [
        { kpiKey: "revenue.collection_rate", label: "Collection Rate", value: Math.round(metrics.collectionRate * 100), trend: metrics.collectionRate > 0.8 ? "up" : "down" },
        { kpiKey: "revenue.monthly", label: "Monthly Revenue", value: mtdCents, trend: revenueTrend },
        { kpiKey: "revenue.overdue_count", label: "Overdue Invoices", value: overdueInvoices.length, trend: overdueInvoices.length === 0 ? "flat" : "down" },
        { kpiKey: "pipeline.acceptance_rate", label: "Estimate Acceptance Rate", value: Math.round(acceptanceRate * 100), trend: acceptanceRate >= 0.6 ? "up" : "down" },
        { kpiKey: "collections.open_cases", label: "Open Collections Cases", value: activeCases.length, trend: activeCases.length === 0 ? "flat" : "down" },
      ];

      return {
        orgId,
        businessId,
        generatedAt,
        revenue: { mtdCents, qtdCents, ytdCents, forecastCents },
        pipeline: {
          totalValueCents: openEstimates.reduce((s, e) => s + e.totalCents, 0),
          estimateCount: openEstimates.length,
          acceptanceRate: Math.round(acceptanceRate * 1000) / 1000,
          avgCycleDays: avgCycleDays !== null ? Math.round(avgCycleDays * 10) / 10 : null,
        },
        invoices: {
          pendingCount: pendingInvoices.length,
          pendingCents: pendingInvoices.reduce((s, i) => s + i.totalCents, 0),
          overdueCount: overdueInvoices.length,
          overdueCents: overdueInvoices.reduce((s, i) => s + i.totalCents, 0),
          paidMtdCents,
        },
        cashFlow: {
          currentBalanceCents,
          forecast30dCents,
          forecast90dCents,
        },
        collections: {
          openCases: activeCases.length,
          totalAtRiskCents,
          collectionRate: Math.round(metrics.collectionRate * 1000) / 1000,
        },
        kpiUpdates,
      };
    },
  };
}
