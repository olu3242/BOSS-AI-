import { describe, expect, it } from "vitest";
import {
  createBossEvent,
  InMemoryEventBus,
  InMemoryEventDeliverySink,
} from "../index.js";

const context = {
  orgId: "org-1",
  actorId: "user-1",
  requestId: "request-1",
  correlationId: "correlation-1",
  traceId: "trace-1",
};

describe("InMemoryEventBus", () => {
  it("routes events with tenant and trace context", async () => {
    const sink = new InMemoryEventDeliverySink();
    const bus = new InMemoryEventBus(sink);
    const received: string[] = [];
    bus.subscribe<{ businessId: string }>("workflow.completed", (event) => {
      received.push(`${event.context!.orgId}:${event.payload.businessId}`);
    });

    await bus.publish(
      createBossEvent("workflow.completed", { businessId: "business-1" }, context),
    );

    expect(received).toEqual(["org-1:business-1"]);
    expect(sink.list()).toEqual([
      expect.objectContaining({
        type: "workflow.completed",
        subscriberCount: 1,
        success: true,
      }),
    ]);
  });

  it("rejects events without execution context", async () => {
    const bus = new InMemoryEventBus();
    await expect(
      bus.publish({
        type: "workflow.started",
        payload: {},
        occurredAt: new Date().toISOString(),
      }),
    ).rejects.toThrow("missing tenant and trace context");
  });
});
