import { nowIso } from "@boss/shared";
import type { RepositoryContainer } from "../container.js";

export type AnalyticsEventType =
  | "analytics.business.created"
  | "analytics.mri.started"
  | "analytics.mri.completed"
  | "analytics.workspace.viewed"
  | "analytics.kpi.viewed"
  | "analytics.health.generated"
  | "analytics.recommendation.accepted"
  | "analytics.recommendation.rejected"
  | "analytics.workflow.executed"
  | "analytics.feedback.submitted"
  | "analytics.nps.submitted"
  | "analytics.integration.connected";

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  orgId: string;
  businessId?: string;
  properties: Record<string, unknown>;
}

export interface AnalyticsFunnelEntry {
  type: string;
  orgId: string;
  businessId: string | null;
  properties: Record<string, unknown>;
  recordedAt: string;
}

export interface ActivationResult {
  activated: number;
  total: number;
  rate: number;
}

export interface ProductAnalyticsService {
  track(event: AnalyticsEvent): Promise<void>;
  queryFunnel(orgId: string, businessId: string): Promise<AnalyticsFunnelEntry[]>;
  getWab(windowDays?: number): Promise<number>;
  getMab(windowDays?: number): Promise<number>;
  getActivationRate(): Promise<ActivationResult>;
}

function businessIdOf(payload: unknown): string | null {
  return ((payload as Record<string, unknown>)["businessId"] as string) ?? null;
}

export function createProductAnalyticsService(repos: RepositoryContainer): ProductAnalyticsService {
  return {
    async track(event) {
      await repos.eventBus.publish({
        type: event.type,
        payload: {
          orgId: event.orgId,
          businessId: event.businessId ?? null,
          ...event.properties,
        },
        occurredAt: nowIso(),
      });
    },

    async queryFunnel(orgId, businessId) {
      const FUNNEL_TYPES: AnalyticsEventType[] = [
        "analytics.business.created",
        "analytics.mri.started",
        "analytics.mri.completed",
        "analytics.workspace.viewed",
        "analytics.health.generated",
        "analytics.recommendation.accepted",
        "analytics.recommendation.rejected",
        "analytics.nps.submitted",
      ];
      const allEvents = await Promise.all(
        FUNNEL_TYPES.map((t) => repos.eventLog.listByType(t))
      );
      return allEvents
        .flat()
        .filter((e) => {
          const p = e.payload as Record<string, unknown>;
          return p["orgId"] === orgId && businessIdOf(e.payload) === businessId;
        })
        .map((e) => ({
          type: e.type,
          orgId,
          businessId,
          properties: e.payload as Record<string, unknown>,
          recordedAt: e.occurredAt,
        }))
        .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
    },

    async getWab(windowDays = 7) {
      const cutoff = new Date(Date.now() - windowDays * 86_400_000).toISOString();
      const events = await repos.eventLog.listByType("analytics.workspace.viewed", 5000);
      const active = new Set(
        events
          .filter((e) => e.occurredAt >= cutoff)
          .map((e) => businessIdOf(e.payload))
          .filter((id): id is string => !!id)
      );
      return active.size;
    },

    async getMab(windowDays = 30) {
      const cutoff = new Date(Date.now() - windowDays * 86_400_000).toISOString();
      const events = await repos.eventLog.listByType("analytics.workspace.viewed", 5000);
      const active = new Set(
        events
          .filter((e) => e.occurredAt >= cutoff)
          .map((e) => businessIdOf(e.payload))
          .filter((id): id is string => !!id)
      );
      return active.size;
    },

    async getActivationRate() {
      const [createdEvents, completedEvents, approvedEvents] = await Promise.all([
        repos.eventLog.listByType("analytics.business.created", 5000),
        repos.eventLog.listByType("analytics.mri.completed", 5000),
        repos.eventLog.listByType("analytics.recommendation.accepted", 5000),
      ]);

      const total = new Set(
        createdEvents.map((e) => businessIdOf(e.payload)).filter((id): id is string => !!id)
      );
      const completedMri = new Set(
        completedEvents.map((e) => businessIdOf(e.payload)).filter((id): id is string => !!id)
      );
      const approved = new Set(
        approvedEvents.map((e) => businessIdOf(e.payload)).filter((id): id is string => !!id)
      );

      const activated = [...total].filter((id) => completedMri.has(id) && approved.has(id)).length;
      return {
        activated,
        total: total.size,
        rate: total.size > 0 ? activated / total.size : 0,
      };
    },
  };
}
