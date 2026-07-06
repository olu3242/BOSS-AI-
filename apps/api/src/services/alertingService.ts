/**
 * TD-034 — Alerting Rules
 *
 * Evaluates system-level alert conditions and fires domain events so
 * downstream sinks (Slack webhook, PagerDuty, OpsGenie) can route them.
 * Conditions per TD-034 recommendation:
 *
 *   DEAD_LETTERS_HIGH   — dead_letters > threshold (default 10)
 *   HEALTH_DEGRADED     — /health status != "ok"
 *   SCHEDULER_RECOVERED — scheduler.recoverFailed() count > threshold in 1h window (default 5)
 *
 * Alerting is edge-triggered: each condition fires once on transition
 * from clear → firing and again on transition firing → clear (resolved).
 */
import type { EventBus } from "@boss/events";
import type { HealthCheckResult, ExecutionRuntimeHealthResult } from "../health.js";

export type AlertSeverity = "warning" | "critical";

export interface AlertRule {
  name: string;
  severity: AlertSeverity;
  description: string;
}

export interface AlertFiring {
  rule: AlertRule;
  firedAt: string;
  value: number;
  threshold: number;
  resolved: boolean;
  resolvedAt?: string;
}

export interface AlertingThresholds {
  deadLettersMax: number;
  schedulerRecoveriesPerHourMax: number;
}

const DEFAULT_THRESHOLDS: AlertingThresholds = {
  deadLettersMax: 10,
  schedulerRecoveriesPerHourMax: 5,
};

export const ALERT_RULES: Record<string, AlertRule> = {
  DEAD_LETTERS_HIGH: {
    name: "DEAD_LETTERS_HIGH",
    severity: "critical",
    description: "Dead-letter queue depth exceeded threshold — jobs are failing without recovery",
  },
  HEALTH_DEGRADED: {
    name: "HEALTH_DEGRADED",
    severity: "warning",
    description: "System health check returned degraded status",
  },
  SCHEDULER_RECOVERED_HIGH: {
    name: "SCHEDULER_RECOVERED_HIGH",
    severity: "warning",
    description: "Scheduler recovery rate exceeded threshold in the past hour — jobs are failing repeatedly",
  },
};

export interface AlertingService {
  /** Evaluate dead-letter depth against threshold. Returns alert if firing. */
  checkDeadLetters(count: number): AlertFiring | null;
  /** Evaluate health check result. Returns alert if degraded. */
  checkHealth(health: HealthCheckResult | ExecutionRuntimeHealthResult): AlertFiring | null;
  /** Record a scheduler recovery event; evaluate rolling 1h rate. Returns alert if threshold exceeded. */
  recordSchedulerRecovery(count: number): AlertFiring | null;
  /** Return all currently firing (unresolved) alerts. */
  getFiringAlerts(): AlertFiring[];
  /** Attach to eventBus — emits alert.fired / alert.resolved domain events. */
  attachToEventBus(eventBus: EventBus): void;
}

export function createAlertingService(
  thresholds: AlertingThresholds = DEFAULT_THRESHOLDS
): AlertingService {
  // Edge-trigger state per rule: true = currently firing
  const firing = new Map<string, AlertFiring>();
  // Sliding window of scheduler recovery timestamps (last 1h)
  const recoveryTimestamps: number[] = [];

  let eventBus: EventBus | null = null;

  function emit(event: string, payload: Record<string, unknown>) {
    eventBus?.publish({ type: event, payload, occurredAt: new Date().toISOString() });
  }

  function fire(ruleName: string, value: number, threshold: number): AlertFiring {
    const rule = ALERT_RULES[ruleName]!;
    const alert: AlertFiring = { rule, firedAt: new Date().toISOString(), value, threshold, resolved: false };
    firing.set(ruleName, alert);
    emit("alert.fired", { ruleName, severity: rule.severity, value, threshold });
    return alert;
  }

  function resolve(ruleName: string): void {
    const existing = firing.get(ruleName);
    if (existing && !existing.resolved) {
      existing.resolved = true;
      existing.resolvedAt = new Date().toISOString();
      firing.delete(ruleName);
      emit("alert.resolved", { ruleName, resolvedAt: existing.resolvedAt });
    }
  }

  return {
    checkDeadLetters(count) {
      if (count > thresholds.deadLettersMax) {
        if (!firing.has("DEAD_LETTERS_HIGH")) {
          return fire("DEAD_LETTERS_HIGH", count, thresholds.deadLettersMax);
        }
        return firing.get("DEAD_LETTERS_HIGH") ?? null;
      }
      resolve("DEAD_LETTERS_HIGH");
      return null;
    },

    checkHealth(health) {
      const status = health.status;
      if (status !== "ok") {
        if (!firing.has("HEALTH_DEGRADED")) {
          return fire("HEALTH_DEGRADED", 1, 0);
        }
        return firing.get("HEALTH_DEGRADED") ?? null;
      }
      resolve("HEALTH_DEGRADED");
      return null;
    },

    recordSchedulerRecovery(count) {
      if (count <= 0) return null;

      const now = Date.now();
      const oneHourAgo = now - 3_600_000;

      // Push new recovery timestamps and evict stale ones
      for (let i = 0; i < count; i++) recoveryTimestamps.push(now);
      // Evict entries older than 1h
      while (recoveryTimestamps.length > 0 && recoveryTimestamps[0]! < oneHourAgo) {
        recoveryTimestamps.shift();
      }

      const rate = recoveryTimestamps.length;
      if (rate > thresholds.schedulerRecoveriesPerHourMax) {
        if (!firing.has("SCHEDULER_RECOVERED_HIGH")) {
          return fire("SCHEDULER_RECOVERED_HIGH", rate, thresholds.schedulerRecoveriesPerHourMax);
        }
        return firing.get("SCHEDULER_RECOVERED_HIGH") ?? null;
      }
      resolve("SCHEDULER_RECOVERED_HIGH");
      return null;
    },

    getFiringAlerts() {
      return [...firing.values()];
    },

    attachToEventBus(bus) {
      eventBus = bus;
    },
  };
}
