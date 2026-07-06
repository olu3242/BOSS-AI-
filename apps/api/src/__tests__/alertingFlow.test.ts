import { describe, it, expect, vi } from "vitest";
import { createAlertingService, ALERT_RULES } from "../services/alertingService.js";
import type { EventBus } from "@boss/events";

function makeEventBus(): { bus: EventBus; events: Array<{ type: string; payload: unknown }> } {
  const events: Array<{ type: string; payload: unknown }> = [];
  const bus: EventBus = {
    publish(event) { events.push({ type: event.type, payload: event.payload }); return Promise.resolve(); },
    subscribe: vi.fn(),
  };
  return { bus, events };
}

describe("AlertingService", () => {
  describe("checkDeadLetters", () => {
    it("fires DEAD_LETTERS_HIGH when count exceeds threshold", () => {
      const svc = createAlertingService({ deadLettersMax: 10, schedulerRecoveriesPerHourMax: 5 });
      const alert = svc.checkDeadLetters(11);
      expect(alert).not.toBeNull();
      expect(alert?.rule.name).toBe("DEAD_LETTERS_HIGH");
      expect(alert?.rule.severity).toBe("critical");
      expect(alert?.value).toBe(11);
      expect(alert?.threshold).toBe(10);
      expect(alert?.resolved).toBe(false);
    });

    it("does not fire when count is at or below threshold", () => {
      const svc = createAlertingService({ deadLettersMax: 10, schedulerRecoveriesPerHourMax: 5 });
      expect(svc.checkDeadLetters(10)).toBeNull();
      expect(svc.checkDeadLetters(0)).toBeNull();
    });

    it("is edge-triggered — repeated calls do not duplicate the alert", () => {
      const svc = createAlertingService({ deadLettersMax: 10, schedulerRecoveriesPerHourMax: 5 });
      svc.checkDeadLetters(15);
      svc.checkDeadLetters(15);
      expect(svc.getFiringAlerts()).toHaveLength(1);
    });

    it("resolves when count drops back below threshold", () => {
      const svc = createAlertingService({ deadLettersMax: 10, schedulerRecoveriesPerHourMax: 5 });
      svc.checkDeadLetters(15);
      expect(svc.getFiringAlerts()).toHaveLength(1);
      svc.checkDeadLetters(5);
      expect(svc.getFiringAlerts()).toHaveLength(0);
    });
  });

  describe("checkHealth", () => {
    it("fires HEALTH_DEGRADED when status is degraded", () => {
      const svc = createAlertingService({ deadLettersMax: 10, schedulerRecoveriesPerHourMax: 5 });
      const alert = svc.checkHealth({ status: "degraded", checkedAt: "", diagnostics: [], runtimeMode: "in_memory" });
      expect(alert?.rule.name).toBe("HEALTH_DEGRADED");
    });

    it("does not fire when health is ok", () => {
      const svc = createAlertingService({ deadLettersMax: 10, schedulerRecoveriesPerHourMax: 5 });
      expect(svc.checkHealth({ status: "ok", checkedAt: "", diagnostics: [], runtimeMode: "in_memory" })).toBeNull();
    });

    it("resolves when health recovers", () => {
      const svc = createAlertingService({ deadLettersMax: 10, schedulerRecoveriesPerHourMax: 5 });
      svc.checkHealth({ status: "degraded", checkedAt: "", diagnostics: [], runtimeMode: "in_memory" });
      expect(svc.getFiringAlerts()).toHaveLength(1);
      svc.checkHealth({ status: "ok", checkedAt: "", diagnostics: [], runtimeMode: "in_memory" });
      expect(svc.getFiringAlerts()).toHaveLength(0);
    });
  });

  describe("recordSchedulerRecovery", () => {
    it("fires SCHEDULER_RECOVERED_HIGH when rolling rate exceeds threshold", () => {
      const svc = createAlertingService({ deadLettersMax: 10, schedulerRecoveriesPerHourMax: 5 });
      const alert = svc.recordSchedulerRecovery(6);
      expect(alert?.rule.name).toBe("SCHEDULER_RECOVERED_HIGH");
      expect(alert?.value).toBe(6);
    });

    it("does not fire below threshold", () => {
      const svc = createAlertingService({ deadLettersMax: 10, schedulerRecoveriesPerHourMax: 5 });
      expect(svc.recordSchedulerRecovery(3)).toBeNull();
    });

    it("accumulates across calls within the 1h window", () => {
      const svc = createAlertingService({ deadLettersMax: 10, schedulerRecoveriesPerHourMax: 5 });
      svc.recordSchedulerRecovery(3);
      const alert = svc.recordSchedulerRecovery(3); // total 6 → over threshold
      expect(alert?.rule.name).toBe("SCHEDULER_RECOVERED_HIGH");
    });
  });

  describe("event bus integration", () => {
    it("emits alert.fired when an alert transitions to firing", () => {
      const { bus, events } = makeEventBus();
      const svc = createAlertingService({ deadLettersMax: 10, schedulerRecoveriesPerHourMax: 5 });
      svc.attachToEventBus(bus);
      svc.checkDeadLetters(15);
      expect(events.some((e) => e.type === "alert.fired")).toBe(true);
    });

    it("emits alert.resolved when an alert clears", () => {
      const { bus, events } = makeEventBus();
      const svc = createAlertingService({ deadLettersMax: 10, schedulerRecoveriesPerHourMax: 5 });
      svc.attachToEventBus(bus);
      svc.checkDeadLetters(15);
      svc.checkDeadLetters(2);
      expect(events.some((e) => e.type === "alert.resolved")).toBe(true);
    });
  });

  describe("ALERT_RULES catalogue", () => {
    it("defines all three required rules", () => {
      expect(ALERT_RULES["DEAD_LETTERS_HIGH"]).toBeDefined();
      expect(ALERT_RULES["HEALTH_DEGRADED"]).toBeDefined();
      expect(ALERT_RULES["SCHEDULER_RECOVERED_HIGH"]).toBeDefined();
    });

    it("DEAD_LETTERS_HIGH is critical severity", () => {
      expect(ALERT_RULES["DEAD_LETTERS_HIGH"]?.severity).toBe("critical");
    });
  });
});
