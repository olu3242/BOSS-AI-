/**
 * Learning Platform — feedback loop service for BOSS intelligence.
 *
 * Records learning signals from every decision outcome and generates
 * insights that improve future recommendations and forecasts.
 */
import { randomUUID } from "node:crypto";
import { createBossEvent, type EventBus } from "@boss/events";
import type { LearningSignal, LearningSignalType, LearningReport, LearningInsight } from "@boss/types";

export interface RecordSignalInput {
  type: LearningSignalType;
  entityId: string;
  entityType: string;
  feedback?: string;
  magnitude?: number;
  metadata?: Record<string, unknown>;
}

export interface LearningPlatformService {
  record(orgId: string, businessId: string, input: RecordSignalInput): Promise<LearningSignal>;
  report(orgId: string, businessId: string): Promise<LearningReport>;
  signals(orgId: string, businessId: string, limit?: number): Promise<LearningSignal[]>;
}

export function createLearningPlatformService(eventBus: EventBus): LearningPlatformService {
  const signals = new Map<string, LearningSignal>();

  function signalsFor(orgId: string, businessId: string): LearningSignal[] {
    return [...signals.values()].filter((s) => s.orgId === orgId && s.businessId === businessId && !s.deletedAt);
  }

  function computeRate(list: LearningSignal[], positive: LearningSignalType[], negative: LearningSignalType[]): number {
    const pos = list.filter((s) => positive.includes(s.type)).length;
    const neg = list.filter((s) => negative.includes(s.type)).length;
    const total = pos + neg;
    return total === 0 ? 0.5 : pos / total;
  }

  function buildInsights(list: LearningSignal[]): LearningInsight[] {
    const insights: LearningInsight[] = [];

    const recSignals = list.filter((s) => s.type.startsWith("recommendation."));
    if (recSignals.length >= 3) {
      const accepted = recSignals.filter((s) => s.type === "recommendation.accepted").length;
      const rate = accepted / recSignals.length;
      insights.push({
        kpiKey: null,
        category: "recommendation",
        pattern: rate > 0.7 ? "High recommendation acceptance rate" : rate < 0.3 ? "Low recommendation acceptance — review quality" : "Moderate recommendation acceptance",
        confidence: Math.min(0.9, 0.5 + recSignals.length * 0.05),
        sampleSize: recSignals.length,
        recommendation: rate < 0.5 ? "Analyze rejected recommendations and adjust prioritization logic" : "Recommendation engine is well calibrated",
      });
    }

    const forecastSignals = list.filter((s) => s.type.startsWith("forecast."));
    if (forecastSignals.length >= 2) {
      const accurate = forecastSignals.filter((s) => s.type === "forecast.accurate").length;
      const rate = accurate / forecastSignals.length;
      insights.push({
        kpiKey: null,
        category: "forecast",
        pattern: rate > 0.7 ? "Forecasts are accurate" : "Forecast accuracy needs improvement",
        confidence: Math.min(0.9, 0.4 + forecastSignals.length * 0.1),
        sampleSize: forecastSignals.length,
        recommendation: rate < 0.6 ? "Increase historical data window for forecasting" : "Forecast model is performing well",
      });
    }

    const workflowSignals = list.filter((s) => s.type.startsWith("workflow."));
    if (workflowSignals.length >= 2) {
      const positive = workflowSignals.filter((s) => s.type === "workflow.outcome.positive").length;
      const rate = positive / workflowSignals.length;
      insights.push({
        kpiKey: null,
        category: "workflow",
        pattern: rate > 0.7 ? "Workflow outcomes are positive" : "Workflow outcomes need review",
        confidence: Math.min(0.9, 0.4 + workflowSignals.length * 0.1),
        sampleSize: workflowSignals.length,
        recommendation: rate < 0.6 ? "Review workflow definitions for underperforming automations" : "Workflow automations are effective",
      });
    }

    return insights;
  }

  return {
    async record(orgId, businessId, input) {
      const now = new Date().toISOString();
      const signal: LearningSignal = {
        id: randomUUID(),
        orgId,
        businessId,
        type: input.type,
        entityId: input.entityId,
        entityType: input.entityType,
        feedback: input.feedback ?? null,
        magnitude: input.magnitude ?? 1,
        metadata: input.metadata ?? {},
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      signals.set(signal.id, signal);

      await eventBus.publish(
        createBossEvent(
          "learning.signal.recorded",
          { signalId: signal.id, type: signal.type, entityType: signal.entityType, entityId: signal.entityId },
          { orgId, businessId, actorId: "learning-platform", requestId: signal.id, correlationId: signal.id, traceId: signal.id },
        ),
      );

      return signal;
    },

    async report(orgId, businessId) {
      const list = signalsFor(orgId, businessId);
      const generatedAt = new Date().toISOString();

      const acceptanceRate = computeRate(
        list,
        ["recommendation.accepted"],
        ["recommendation.rejected", "recommendation.deferred"],
      );

      const forecastAccuracy = computeRate(
        list,
        ["forecast.accurate"],
        ["forecast.inaccurate"],
      );

      const positiveWorkflowRate = computeRate(
        list,
        ["workflow.outcome.positive"],
        ["workflow.outcome.negative"],
      );

      return {
        orgId,
        businessId,
        generatedAt,
        totalSignals: list.length,
        acceptanceRate,
        forecastAccuracy,
        positiveWorkflowRate,
        insights: buildInsights(list),
      };
    },

    async signals(orgId, businessId, limit = 100) {
      return signalsFor(orgId, businessId).slice(-limit);
    },
  };
}
