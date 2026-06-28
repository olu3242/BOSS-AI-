import { describe, expect, it } from "vitest";
import { InMemoryEventBus } from "@boss/events";
import type { QueueJob, WorkflowExecutionRecord } from "@boss/loop";
import {
  JournaledEventBus,
  PostgresAgentExecutionSink,
  PostgresEventJournal,
  PostgresRuntimeJobStore,
  PostgresRuntimeScheduleStore,
  PostgresRuntimeWorker,
  PostgresWorkflowExecutionStore,
  type DurableRuntimeJobStore,
  type RuntimeQuery,
  type WorkerStatus,
} from "../runtimePersistence.js";

const context = {
  orgId: "00000000-0000-4000-8000-000000000001",
  actorId: "user-1",
  requestId: "request-1",
  correlationId: "correlation-1",
  traceId: "trace-1",
};

describe("Postgres runtime persistence", () => {
  it("upserts workflow checkpoints and scopes reads by tenant", async () => {
    const calls: Array<{ text: string; params: unknown[] }> = [];
    const row = {
      id: "10000000-0000-4000-8000-000000000001",
      org_id: context.orgId,
      definition_id: "workflow-1",
      business_id: "business-1",
      context,
      state: "running",
      current_step_id: "step-1",
      completed_step_ids: [],
      outputs: {},
      error: null,
      started_at: "2026-06-27T00:00:00.000Z",
      updated_at: "2026-06-27T00:00:01.000Z",
      completed_at: null,
    } satisfies Record<string, unknown>;
    const execute: RuntimeQuery = async <TRow>(
      text: string,
      params: unknown[] = [],
    ) => {
      calls.push({ text, params });
      return (text.startsWith("SELECT") ? [row] : []) as TRow[];
    };
    const store = new PostgresWorkflowExecutionStore(execute);
    const record: WorkflowExecutionRecord = {
      id: row.id,
      definitionId: row.definition_id,
      businessId: row.business_id,
      context,
      state: "running",
      currentStepId: "step-1",
      completedStepIds: [],
      outputs: {},
      error: null,
      startedAt: row.started_at,
      updatedAt: row.updated_at,
      completedAt: null,
    };

    await store.save(record);
    const loaded = await store.get(record.id, context.orgId);

    expect(calls[0]?.text).toContain("ON CONFLICT (id) DO UPDATE");
    expect(calls[1]?.text).toContain("id = $1 AND org_id = $2");
    expect(calls[1]?.params).toEqual([record.id, context.orgId]);
    expect(loaded).toEqual(record);
  });

  it("uses idempotency constraints and skip-locked worker leases", async () => {
    const calls: string[] = [];
    const jobRow = {
      id: "20000000-0000-4000-8000-000000000001",
      queue_name: "workflow.execute",
      payload: { workflowId: "workflow-1" },
      context,
      attempts: 0,
      maximum_attempts: 3,
      state: "pending",
      error: null,
      created_at: "2026-06-27T00:00:00.000Z",
      updated_at: "2026-06-27T00:00:00.000Z",
    };
    const execute: RuntimeQuery = async <TRow>(text: string) => {
      calls.push(text);
      return [jobRow] as TRow[];
    };
    const store = new PostgresRuntimeJobStore(execute);

    await store.enqueue({
      queueName: "workflow.execute",
      payload: jobRow.payload,
      context,
      idempotencyKey: "workflow-1:request-1",
    });
    await store.claim(["workflow.execute"], "worker-1");

    expect(calls[0]).toContain(
      "ON CONFLICT (org_id, queue_name, idempotency_key)",
    );
    expect(calls[1]).toContain("FOR UPDATE SKIP LOCKED");
    expect(calls[1]).toContain("lease_expires_at");
  });

  it("executes leased jobs and reports the worker lifecycle", async () => {
    const statuses: WorkerStatus[] = [];
    let completed = false;
    const job: QueueJob = {
      id: "30000000-0000-4000-8000-000000000001",
      name: "workflow.execute",
      payload: {},
      context,
      attempts: 1,
      maximumAttempts: 3,
      state: "running",
      error: null,
      createdAt: "2026-06-27T00:00:00.000Z",
      updatedAt: "2026-06-27T00:00:00.000Z",
    };
    const store: DurableRuntimeJobStore = {
      enqueue: async () => job,
      claim: async () => job,
      complete: async () => {
        completed = true;
        return true;
      },
      fail: async () => undefined,
      heartbeat: async (_workerId, _instanceId, status) => {
        statuses.push(status);
      },
    };
    const worker = new PostgresRuntimeWorker(
      store,
      "worker-1",
      "instance-1",
      { "workflow.execute": async () => undefined },
    );

    await worker.start();
    await worker.runOnce();
    await worker.stop();

    expect(completed).toBe(true);
    expect(statuses).toEqual([
      "starting",
      "ready",
      "ready",
      "draining",
      "stopped",
    ]);
  });

  it("atomically dispatches due schedules with duplicate protection", async () => {
    const statements: string[] = [];
    const execute: RuntimeQuery = async <TRow>(text: string) => {
      statements.push(text);
      if (text.includes("WITH due AS")) {
        return [
          { jobs_created: "1", schedules_advanced: "1" },
        ] as TRow[];
      }
      return [
        { id: "50000000-0000-4000-8000-000000000001" },
      ] as TRow[];
    };
    const schedules = new PostgresRuntimeScheduleStore(execute);

    const scheduleId = await schedules.schedule({
      queueName: "workflow.execute",
      payload: { workflowId: "workflow-1" },
      context,
      runAt: "2026-06-27T00:00:00.000Z",
      idempotencyKey: "daily-workflow-1",
    });
    const result = await schedules.dispatchDue(10);

    expect(scheduleId).toBe("50000000-0000-4000-8000-000000000001");
    expect(statements[0]).toContain(
      "ON CONFLICT (org_id, queue_name, idempotency_key)",
    );
    expect(statements[1]).toContain("FOR UPDATE SKIP LOCKED");
    expect(statements[1]).toContain("INSERT INTO runtime_jobs");
    expect(statements[1]).toContain("UPDATE runtime_schedules");
    expect(result).toEqual({ jobsCreated: 1, schedulesAdvanced: 1 });
  });

  it("journals events before delivery and persists agent results", async () => {
    const statements: string[] = [];
    const execute: RuntimeQuery = async <TRow>(text: string) => {
      statements.push(text);
      return [] as TRow[];
    };
    const delegate = new InMemoryEventBus();
    const bus = new JournaledEventBus(
      delegate,
      new PostgresEventJournal(execute),
    );
    let delivered = false;
    delegate.subscribe("workflow.completed", () => {
      delivered = true;
    });

    await bus.publish({
      type: "workflow.completed",
      payload: { executionId: "execution-1" },
      occurredAt: "2026-06-27T00:00:00.000Z",
      context,
    });
    await new PostgresAgentExecutionSink(execute).record({
      id: "40000000-0000-4000-8000-000000000001",
      agentId: "ceo_advisor",
      context,
      state: "completed",
      output: { recommendation: "focus" },
      error: null,
      startedAt: "2026-06-27T00:00:00.000Z",
      completedAt: "2026-06-27T00:00:01.000Z",
    });

    expect(delivered).toBe(true);
    expect(statements[0]).toContain("INSERT INTO runtime_events");
    expect(statements[1]).toContain("INSERT INTO agent_executions");
  });
});
