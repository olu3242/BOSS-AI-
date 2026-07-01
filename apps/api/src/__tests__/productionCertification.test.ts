import { describe, expect, it } from "vitest";
import {
  createExecutionRuntimeHealth,
  createHealthCheck,
} from "../health.js";
import {
  createAuditEvent,
  createStructuredLog,
  createTraceId,
  InMemoryAuditSink,
  measureOperation,
} from "../observability.js";
import { assertPlatformAccess, AuthorizationError, hasPermission, type PlatformSession } from "../security.js";

describe("production certification utilities", () => {
  it("enforces tenant and role permissions", () => {
    const viewer: PlatformSession = {
      userId: "user-1",
      orgId: "org-1",
      role: "viewer",
    };

    expect(hasPermission(viewer, "business:read")).toBe(true);
    expect(hasPermission(viewer, "recommendation:approve")).toBe(false);
    expect(() => assertPlatformAccess(viewer, "org-1", "business:read")).not.toThrow();
    expect(() => assertPlatformAccess(viewer, "org-2", "business:read")).toThrow(AuthorizationError);
    expect(() => assertPlatformAccess(viewer, "org-1", "recommendation:approve")).toThrow(AuthorizationError);
  });

  it("creates traceable logs, metrics, and audit events", async () => {
    const traceId = createTraceId();
    const log = createStructuredLog({
      level: "info",
      traceId,
      message: "Certification event",
      context: { workflow: "command_center" },
    });
    const { result, metric } = await measureOperation("certification.fast_check", traceId, async () => "ok");
    const audit = createAuditEvent({
      traceId,
      orgId: "org-1",
      actorId: "user-1",
      action: "business:read",
      resourceType: "business",
      resourceId: "business-1",
      outcome: "success",
      metadata: { source: "test" },
    });
    const sink = new InMemoryAuditSink();
    sink.record(audit);

    expect(log.traceId).toBe(traceId);
    expect(result).toBe("ok");
    expect(metric.success).toBe(true);
    expect(sink.list("org-1")).toHaveLength(1);
    expect(sink.list("org-2")).toHaveLength(0);
  });

  it("reports environment readiness by runtime mode", () => {
    expect(createHealthCheck("in_memory", {}).status).toBe("ok");
    expect(createHealthCheck("postgres", {}).status).toBe("degraded");
    expect(createHealthCheck("postgres", { DATABASE_URL: "postgresql://example" }).status).toBe("ok");
    expect(
      createExecutionRuntimeHealth({
        state: "running",
        startedAt: new Date().toISOString(),
        checkedAt: new Date().toISOString(),
        queueDepth: 0,
        deadLetterCount: 0,
        activeAgentExecutions: 0,
        activeWorkflowExecutions: 0,
      }).status,
    ).toBe("ok");
  });
});
