import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryContainer } from "../container.js";
import { createEventLogCompactionService } from "../services/eventLogCompactionService.js";

describe("EventLogCompactionService", () => {
  let c: ReturnType<typeof createInMemoryContainer>;

  beforeEach(() => {
    c = createInMemoryContainer();
  });

  async function seedEvents(orgId: string, count: number, daysAgo: number) {
    const occurredAt = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
    for (let i = 0; i < count; i++) {
      await c.eventLog.append({ type: "test.event", payload: { i }, occurredAt, orgId, correlationId: null, causationId: null });
    }
  }

  it("compactForOrg removes events older than retentionDays for that org only", async () => {
    const svc = createEventLogCompactionService(c.eventLog);

    await seedEvents("org-a", 5, 100); // 100 days old — should be deleted
    await seedEvents("org-b", 3, 100); // also old, but different org
    await seedEvents("org-a", 2, 10);  // 10 days old — should be kept

    const result = await svc.compactForOrg("org-a", 90);

    expect(result.deletedCount).toBe(5);
    expect(result.retentionDays).toBe(90);
    expect(result.ranAt).toBeTruthy();

    const remaining = await c.eventLog.listByOrgId("org-a");
    expect(remaining).toHaveLength(2);

    // org-b is untouched
    const orgBRows = await c.eventLog.listByOrgId("org-b");
    expect(orgBRows).toHaveLength(3);
  });

  it("compactAll removes old events across all orgs", async () => {
    const svc = createEventLogCompactionService(c.eventLog);

    await seedEvents("org-a", 4, 95);
    await seedEvents("org-b", 6, 95);
    await seedEvents("org-a", 1, 5); // recent — kept

    const result = await svc.compactAll(90);

    expect(result.deletedCount).toBe(10);

    const aRemaining = await c.eventLog.listByOrgId("org-a");
    expect(aRemaining).toHaveLength(1);

    const bRemaining = await c.eventLog.listByOrgId("org-b");
    expect(bRemaining).toHaveLength(0);
  });

  it("compactForOrg with no old events returns 0", async () => {
    const svc = createEventLogCompactionService(c.eventLog);

    await seedEvents("org-a", 3, 10); // recent

    const result = await svc.compactForOrg("org-a", 90);

    expect(result.deletedCount).toBe(0);
    expect(await c.eventLog.listByOrgId("org-a")).toHaveLength(3);
  });

  it("compactAll on empty log returns 0", async () => {
    const svc = createEventLogCompactionService(c.eventLog);
    const result = await svc.compactAll();
    expect(result.deletedCount).toBe(0);
  });
});
