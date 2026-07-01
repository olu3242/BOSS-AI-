import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { nowIso } from "@boss/shared";

describe("RC1 — Durable Event Log (WS4)", () => {
  let repos: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    repos = createInMemoryContainer();
  });

  it("persists events published through the event bus", async () => {
    await repos.eventBus.publish({
      type: "test.event.fired",
      payload: { orgId: "org1", value: 42 },
      occurredAt: nowIso(),
    });

    const entries = await repos.eventLog.listByType("test.event.fired");
    expect(entries.length).toBe(1);
    expect(entries[0]?.type).toBe("test.event.fired");
    expect((entries[0]?.payload as { value: number }).value).toBe(42);
  });

  it("still dispatches to in-process subscribers after persisting", async () => {
    const received: string[] = [];
    repos.eventBus.subscribe("test.subscriber", () => received.push("fired"));

    await repos.eventBus.publish({ type: "test.subscriber", payload: {}, occurredAt: nowIso() });

    expect(received).toContain("fired");
    const entries = await repos.eventLog.listByType("test.subscriber");
    expect(entries.length).toBe(1);
  });

  it("listSince returns only events after the given timestamp", async () => {
    const before = nowIso();
    await repos.eventBus.publish({ type: "early.event", payload: {}, occurredAt: before });

    const after = new Date(Date.now() + 1).toISOString();
    await repos.eventBus.publish({ type: "late.event", payload: {}, occurredAt: after });

    const entries = await repos.eventLog.listSince(after);
    expect(entries.some((e) => e.type === "late.event")).toBe(true);
  });

  it("listByOrgId filters by org", async () => {
    await repos.eventBus.publish({ type: "org.event", payload: { orgId: "org-A" }, occurredAt: nowIso() });
    await repos.eventBus.publish({ type: "org.event", payload: { orgId: "org-B" }, occurredAt: nowIso() });

    const orgA = await repos.eventLog.listByOrgId("org-A");
    expect(orgA.length).toBe(1);
    expect(orgA[0]?.orgId).toBe("org-A");
  });

  it("direct eventLog.append works independently of eventBus", async () => {
    const entry = await repos.eventLog.append({
      type: "direct.append",
      payload: { source: "test" },
      occurredAt: nowIso(),
      orgId: "org1",
      correlationId: "corr-123",
      causationId: null,
    });

    expect(entry.id).toBeDefined();
    expect(entry.correlationId).toBe("corr-123");

    const byCorr = await repos.eventLog.listByCorrelationId("corr-123");
    expect(byCorr.length).toBe(1);
  });
});
