import { operatingLoopRegistry } from "@boss/registries";

export function seedOperatingLoops(): void {
  operatingLoopRegistry.register({
    key: "standard_daily_loop",
    label: "Standard Daily Operating Loop",
    description: "Full 8-phase operating loop running daily to observe, analyze, decide, plan, execute, verify, learn, and improve business operations.",
    frequency: "daily",
    phases: [
      { phase: "observe", enabled: true, timeoutSeconds: 30, retryOnFailure: true },
      { phase: "analyze", enabled: true, timeoutSeconds: 60, retryOnFailure: true },
      { phase: "decide", enabled: true, timeoutSeconds: 45, retryOnFailure: true },
      { phase: "plan", enabled: true, timeoutSeconds: 60, retryOnFailure: true },
      { phase: "execute", enabled: true, timeoutSeconds: 300, retryOnFailure: true },
      { phase: "verify", enabled: true, timeoutSeconds: 60, retryOnFailure: false },
      { phase: "learn", enabled: true, timeoutSeconds: 30, retryOnFailure: false },
      { phase: "improve", enabled: true, timeoutSeconds: 30, retryOnFailure: false },
    ],
    autoApproveThreshold: 0.85,
    maxConcurrentDecisions: 3,
    notifyOnCompletion: true,
  });

  operatingLoopRegistry.register({
    key: "realtime_event_loop",
    label: "Real-Time Event-Driven Loop",
    description: "Lightweight real-time loop triggered by business events — observe and analyze phases only, escalates to daily loop for decisions.",
    frequency: "realtime",
    phases: [
      { phase: "observe", enabled: true, timeoutSeconds: 5, retryOnFailure: true },
      { phase: "analyze", enabled: true, timeoutSeconds: 15, retryOnFailure: true },
      { phase: "decide", enabled: false, timeoutSeconds: 0, retryOnFailure: false },
      { phase: "plan", enabled: false, timeoutSeconds: 0, retryOnFailure: false },
      { phase: "execute", enabled: false, timeoutSeconds: 0, retryOnFailure: false },
      { phase: "verify", enabled: false, timeoutSeconds: 0, retryOnFailure: false },
      { phase: "learn", enabled: false, timeoutSeconds: 0, retryOnFailure: false },
      { phase: "improve", enabled: false, timeoutSeconds: 0, retryOnFailure: false },
    ],
    autoApproveThreshold: 0.95,
    maxConcurrentDecisions: 1,
    notifyOnCompletion: false,
  });

  operatingLoopRegistry.register({
    key: "weekly_strategic_loop",
    label: "Weekly Strategic Review Loop",
    description: "Weekly full-cycle loop focused on strategic decisions, trend analysis, and organizational learning with human approval gates.",
    frequency: "weekly",
    phases: [
      { phase: "observe", enabled: true, timeoutSeconds: 60, retryOnFailure: true },
      { phase: "analyze", enabled: true, timeoutSeconds: 120, retryOnFailure: true },
      { phase: "decide", enabled: true, timeoutSeconds: 90, retryOnFailure: true },
      { phase: "plan", enabled: true, timeoutSeconds: 120, retryOnFailure: true },
      { phase: "execute", enabled: true, timeoutSeconds: 600, retryOnFailure: true },
      { phase: "verify", enabled: true, timeoutSeconds: 120, retryOnFailure: false },
      { phase: "learn", enabled: true, timeoutSeconds: 60, retryOnFailure: false },
      { phase: "improve", enabled: true, timeoutSeconds: 60, retryOnFailure: false },
    ],
    autoApproveThreshold: 0.70,
    maxConcurrentDecisions: 5,
    notifyOnCompletion: true,
  });
}
