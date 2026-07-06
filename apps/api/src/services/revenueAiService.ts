/**
 * Revenue AI Service — Wave 2 Revenue OS
 * Rule-based heuristics for pricing recommendations, collections risk,
 * cash flow alerts, and cross-sell opportunities.
 * No external AI calls — deterministic logic only.
 */
import type { RepositoryContainer } from "../container.js";
import type { RevenueIntelligenceService } from "./revenueIntelligenceService.js";
import type { CollectionsService } from "./collectionsService.js";

export interface RevenueAiService {
  pricingRecommendation(
    orgId: string,
    businessId: string,
  ): Promise<{
    recommendations: Array<{
      item: string;
      currentPrice: number;
      suggestedPrice: number;
      rationale: string;
    }>;
  }>;

  collectionsRisk(
    orgId: string,
    businessId: string,
  ): Promise<
    Array<{ invoiceId: string; customerId: string; riskScore: number; suggestedAction: string }>
  >;

  cashFlowAlert(
    orgId: string,
    businessId: string,
  ): Promise<{
    alerts: Array<{
      severity: "low" | "medium" | "high" | "critical";
      message: string;
      recommendedAction: string;
    }>;
  }>;

  crossSellOpportunities(
    orgId: string,
    businessId: string,
  ): Promise<
    Array<{
      customerId: string;
      opportunity: string;
      estimatedValueCents: number;
      confidence: number;
    }>
  >;
}

export function createRevenueAiService(
  repos: RepositoryContainer,
  revenueIntelligence: RevenueIntelligenceService,
  collectionsService: CollectionsService,
): RevenueAiService {
  return {
    async pricingRecommendation(orgId, businessId) {
      const estimates = await repos.estimates.listByBusinessId(orgId, businessId);
      const total = estimates.length;
      const accepted = estimates.filter((e) => e.status === "accepted" || e.status === "converted").length;
      const acceptanceRate = total > 0 ? accepted / total : 1;

      const recommendations: Array<{
        item: string;
        currentPrice: number;
        suggestedPrice: number;
        rationale: string;
      }> = [];

      if (acceptanceRate < 0.6 && total >= 3) {
        // Suggest 5-10% reduction
        const reductionRate = acceptanceRate < 0.4 ? 0.9 : 0.95;
        const invoices = await repos.invoices.listByBusiness(orgId, businessId);
        const avgInvoiceValue =
          invoices.length > 0
            ? invoices.reduce((s, i) => s + i.totalCents, 0) / invoices.length
            : 0;

        recommendations.push({
          item: "general_service_pricing",
          currentPrice: Math.round(avgInvoiceValue),
          suggestedPrice: Math.round(avgInvoiceValue * reductionRate),
          rationale: `Estimate acceptance rate is ${Math.round(acceptanceRate * 100)}% (below 60% target). A ${Math.round((1 - reductionRate) * 100)}% price reduction may improve conversion.`,
        });
      }

      return { recommendations };
    },

    async collectionsRisk(orgId, businessId) {
      const openCases = await collectionsService.listCases(orgId, businessId);
      return openCases
        .filter((c) => c.status !== "resolved" && c.status !== "written_off")
        .map((c) => ({
          invoiceId: c.invoiceId,
          customerId: c.customerId,
          riskScore: c.riskScore,
          suggestedAction:
            c.riskScore > 0.8
              ? "Immediate escalation recommended"
              : c.riskScore > 0.5
              ? "Send payment reminder"
              : "Monitor and follow up",
        }));
    },

    async cashFlowAlert(orgId, businessId) {
      const forecast = await revenueIntelligence.cashFlowForecast(orgId, businessId, 3);
      const metrics = await revenueIntelligence.compute(orgId, businessId);

      const monthlyAmounts = metrics.monthlyRevenue.map((m) => m.collectedCents);
      const nonZero = monthlyAmounts.filter((v) => v > 0);
      const avgMonthly = nonZero.length > 0 ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0;

      const alerts: Array<{
        severity: "low" | "medium" | "high" | "critical";
        message: string;
        recommendedAction: string;
      }> = [];

      for (const period of forecast) {
        const ratio = avgMonthly > 0 ? period.expectedCents / avgMonthly : 1;
        if (ratio < 0.5) {
          alerts.push({
            severity: "critical",
            message: `Cash flow in ${period.period} is forecast at ${Math.round(ratio * 100)}% of average monthly revenue`,
            recommendedAction: "Accelerate collections and defer non-essential expenses immediately",
          });
        } else if (ratio < 0.7) {
          alerts.push({
            severity: "high",
            message: `Cash flow in ${period.period} is forecast at ${Math.round(ratio * 100)}% of average monthly revenue`,
            recommendedAction: "Send early payment reminders and review outstanding invoices",
          });
        } else if (ratio < 0.8) {
          alerts.push({
            severity: "medium",
            message: `Cash flow in ${period.period} is forecast slightly below average`,
            recommendedAction: "Monitor collections and follow up on overdue invoices",
          });
        }
      }

      // Alert if current overdue is high
      if (metrics.overdueRevenueCents > avgMonthly * 0.5 && avgMonthly > 0) {
        alerts.push({
          severity: "high",
          message: `Outstanding overdue revenue ($${(metrics.overdueRevenueCents / 100).toFixed(2)}) exceeds 50% of average monthly collections`,
          recommendedAction: "Initiate collections cycle immediately",
        });
      }

      return { alerts };
    },

    async crossSellOpportunities(orgId, businessId) {
      const invoices = await repos.invoices.listByBusiness(orgId, businessId);
      const jobs = await repos.jobs.listByBusiness(orgId, businessId);

      // Customers with 2+ completed jobs and no recurring invoice
      const completedJobsByCustomer = new Map<string, number>();
      for (const job of jobs.filter((j) => j.status === "completed")) {
        const customerId = (job as unknown as { customerId?: string }).customerId;
        if (customerId) {
          completedJobsByCustomer.set(customerId, (completedJobsByCustomer.get(customerId) ?? 0) + 1);
        }
      }

      const recurringCustomers = new Set(
        invoices
          .filter((i) => i.notes?.toLowerCase().includes("recurring") || i.terms?.toLowerCase().includes("recurring"))
          .map((i) => i.customerId),
      );

      const opportunities: Array<{
        customerId: string;
        opportunity: string;
        estimatedValueCents: number;
        confidence: number;
      }> = [];

      for (const [customerId, jobCount] of completedJobsByCustomer.entries()) {
        if (jobCount >= 2 && !recurringCustomers.has(customerId)) {
          const customerInvoices = invoices.filter((i) => i.customerId === customerId);
          const avgInvoiceValue =
            customerInvoices.length > 0
              ? customerInvoices.reduce((s, i) => s + i.totalCents, 0) / customerInvoices.length
              : 0;

          opportunities.push({
            customerId,
            opportunity: "Maintenance contract / recurring service agreement",
            estimatedValueCents: Math.round(avgInvoiceValue * 12), // annualised
            confidence: Math.min(0.9, 0.5 + jobCount * 0.1),
          });
        }
      }

      return opportunities;
    },
  };
}
