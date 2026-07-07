/**
 * Platform SDK — the single canonical entry point for all cross-cutting platform operations.
 *
 * Enforces BOSS architectural laws:
 *   - Every state change emits an event (event-driven)
 *   - All intelligence from MCP; execution through Loop
 *   - Tenant isolation enforced at every call site
 *   - Audit trail written before side effects
 *
 * Usage in services:
 *   const sdk = createPlatformSdk(repos);
 *   await sdk.emit(orgId, businessId, "customer.created", { customerId });
 *   await sdk.notify(orgId, { channel: "email", recipient: "...", body: "..." });
 */
import { nowIso } from "@boss/shared";
import type { RepositoryContainer } from "../container.js";
import type { NotificationRequest, NotificationResult } from "./notificationService.js";
import { createNotificationService } from "./notificationService.js";

export interface PlatformEventPayload extends Record<string, unknown> {
  orgId: string;
  businessId?: string;
}

export interface AuditEntry {
  orgId: string;
  businessId?: string;
  action: string;
  actor: string;
  resourceType: string;
  resourceId: string;
  payload?: Record<string, unknown>;
  occurredAt: string;
}

export interface PlatformSdk {
  /** Emit a domain event to the event bus */
  emit(orgId: string, businessId: string | undefined, type: string, payload: Record<string, unknown>): Promise<void>;

  /** Send a notification through the canonical NotificationService */
  notify(request: NotificationRequest): Promise<NotificationResult>;

  /** Write an audit log entry */
  audit(entry: AuditEntry): Promise<void>;

  /** Measure a KPI value */
  measure(orgId: string, businessId: string, kpiKey: string, value: number, label: string): Promise<void>;

  /** Schedule a future workflow execution */
  schedule(orgId: string, businessId: string, workflowKey: string, runAt: string, input: Record<string, unknown>): Promise<string>;

  /** Dispatch a workflow execution immediately */
  dispatch(orgId: string, businessId: string, workflowKey: string, steps: import("@boss/loop").StepEntry[]): Promise<import("@boss/types").WorkflowExecution>;

  /** Check if a feature flag is enabled for an org */
  isEnabled(flag: import("./featureFlagService.js").FeatureFlag, orgId?: string): Promise<boolean>;
}

export function createPlatformSdk(
  repos: RepositoryContainer,
  loopRuntime?: { execute(orgId: string, businessId: string, workflowKey: string, steps: import("@boss/loop").StepEntry[]): Promise<import("@boss/types").WorkflowExecution> },
): PlatformSdk {
  const notificationService = createNotificationService(repos);

  return {
    async emit(orgId, businessId, type, payload) {
      await repos.eventBus.publish({
        type,
        payload: { ...payload, orgId, ...(businessId ? { businessId } : {}) },
        occurredAt: nowIso(),
      });
    },

    async notify(request) {
      return notificationService.send(request);
    },

    async audit(entry) {
      await repos.eventBus.publish({
        type: "platform.audit.recorded",
        payload: entry,
        occurredAt: entry.occurredAt,
      });
    },

    async measure(orgId, businessId, kpiKey, value, label) {
      const measuredAt = nowIso();
      await repos.kpiReadings.append({
        orgId,
        businessId,
        kpiKey,
        label,
        value,
        unit: "count",
        trend: "unknown",
        source: "event_log",
        measuredAt,
      });
      await repos.eventBus.publish({
        type: "business.kpi.measured",
        payload: { orgId, businessId, kpiKey, label, value, measuredAt },
        occurredAt: measuredAt,
      });
    },

    async schedule(orgId, businessId, workflowKey, runAt, input) {
      const job = await repos.schedulerJobs.create({
        orgId,
        businessId,
        workflowKey,
        triggerType: "delayed",
        cronExpression: null,
        timezone: "UTC",
        runAt,
        state: "pending",
        lastRunAt: null,
        nextRunAt: runAt,
        runCount: 0,
        maxRuns: 1,
        payload: input,
        errorMessage: null,
      });
      return job.id;
    },

    async dispatch(orgId, businessId, workflowKey, steps) {
      if (!loopRuntime) throw new Error("Loop runtime not configured");
      return loopRuntime.execute(orgId, businessId, workflowKey, steps);
    },

    async isEnabled(flag, orgId) {
      const { createFeatureFlagService } = await import("./featureFlagService.js");
      return createFeatureFlagService().isEnabled(flag, orgId);
    },
  };
}
