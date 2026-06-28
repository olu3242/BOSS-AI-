import { describe, expect, it } from "vitest";
import {
  InMemoryMvpJourneyStore,
  MVP_JOURNEY_STAGES,
  MvpJourneyTracker,
  PostgresMvpJourneyStore,
  type JourneyQuery,
} from "../mvpJourney.js";

describe("MVP journey instrumentation", () => {
  it("measures landing-to-first-value against the twenty-minute target", async () => {
    let minute = 0;
    const tracker = new MvpJourneyTracker(
      new InMemoryMvpJourneyStore(),
      () => new Date(Date.UTC(2026, 5, 27, 12, minute++, 0)),
    );

    let report;
    for (const stage of MVP_JOURNEY_STAGES) {
      report = await tracker.record(
        "10000000-0000-4000-8000-000000000001",
        stage,
        {
          traceId: "trace-first-value",
          orgId:
            stage === "landing_viewed"
              ? undefined
              : "20000000-0000-4000-8000-000000000001",
        },
      );
    }

    expect(report).toEqual(
      expect.objectContaining({
        currentStage: "first_value_visible",
        nextStage: null,
        completed: true,
        elapsedMilliseconds: 12 * 60 * 1_000,
        withinTarget: true,
        stagesCompleted: MVP_JOURNEY_STAGES.length,
      }),
    );
  });

  it("rejects skipped stages and treats retries as idempotent", async () => {
    const store = new InMemoryMvpJourneyStore();
    const tracker = new MvpJourneyTracker(store);
    const journeyId = "30000000-0000-4000-8000-000000000001";
    const context = { traceId: "trace-order" };

    const first = await tracker.record(
      journeyId,
      "landing_viewed",
      context,
    );
    const duplicate = await tracker.record(
      journeyId,
      "landing_viewed",
      context,
    );

    expect(duplicate).toEqual(first);
    await expect(
      tracker.record(journeyId, "diagnostic_completed", context),
    ).rejects.toThrow('expected stage "signup_completed"');
    expect((await tracker.report(journeyId)).completed).toBe(false);
  });

  it("persists stages idempotently through the Postgres adapter", async () => {
    const statements: string[] = [];
    const execute: JourneyQuery = async <TRow>(text: string) => {
      statements.push(text);
      return (text.startsWith("INSERT") ? [{ id: "event-1" }] : []) as TRow[];
    };
    const store = new PostgresMvpJourneyStore(execute);

    const inserted = await store.append({
      id: "40000000-0000-4000-8000-000000000001",
      journeyId: "50000000-0000-4000-8000-000000000001",
      stage: "landing_viewed",
      orgId: null,
      actorId: null,
      businessId: null,
      traceId: "trace-postgres",
      metadata: {},
      occurredAt: "2026-06-27T12:00:00.000Z",
    });

    expect(inserted).toBe(true);
    expect(statements[0]).toContain(
      "ON CONFLICT (journey_id, stage) DO NOTHING",
    );
  });
});
