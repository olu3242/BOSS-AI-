import { randomUUID } from "node:crypto";
import { query } from "@boss/db";
import type {
  BossEvent,
  EventBus,
  RoutedBossEvent,
} from "@boss/events";
import type {
  AgentExecution,
  AgentExecutionSink,
  ExecutionContext,
  QueueJob,
  QueueJobState,
  WorkflowExecutionRecord,
  WorkflowExecutionStore,
} from "@boss/loop";

export interface RuntimeQuery {
  <TRow>(text: string, params?: unknown[]): Promise<TRow[]>;
}

export interface DurableJobInput<TPayload = unknown> {
  readonly queueName: string;
  readonly payload: TPayload;
  readonly context: ExecutionContext;
  readonly maximumAttempts?: number;
  readonly idempotencyKey?: string;
  readonly availableAt?: string;
}

export interface DurableScheduleInput<TPayload = unknown> {
  readonly queueName: string;
  readonly payload: TPayload;
  readonly context: ExecutionContext;
  readonly runAt: string;
  readonly recurrenceMilliseconds?: number;
  readonly maximumAttempts?: number;
  readonly idempotencyKey?: string;
}

export interface ScheduleDispatchResult {
  readonly jobsCreated: number;
  readonly schedulesAdvanced: number;
}

export interface DurableRuntimeJobStore {
  enqueue<TPayload>(input: DurableJobInput<TPayload>): Promise<QueueJob>;
  claim(
    queueNames: readonly string[],
    workerId: string,
    leaseMilliseconds?: number,
  ): Promise<QueueJob | undefined>;
  complete(orgId: string, jobId: string, workerId: string): Promise<boolean>;
  fail(
    orgId: string,
    jobId: string,
    workerId: string,
    error: string,
    retryDelayMilliseconds?: number,
  ): Promise<QueueJob | undefined>;
  heartbeat(
    workerId: string,
    instanceId: string,
    status: WorkerStatus,
    metadata?: Readonly<Record<string, unknown>>,
  ): Promise<void>;
}

export type WorkerStatus =
  | "starting"
  | "ready"
  | "draining"
  | "stopped"
  | "unhealthy";

export type DurableJobHandler = (job: QueueJob) => Promise<void>;

export interface EventJournal {
  record(event: RoutedBossEvent): Promise<void>;
}

interface WorkflowExecutionRow {
  id: string;
  org_id: string;
  definition_id: string;
  business_id: string;
  context: ExecutionContext;
  state: WorkflowExecutionRecord["state"];
  current_step_id: string | null;
  completed_step_ids: string[];
  outputs: Record<string, unknown>;
  error: string | null;
  started_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface RuntimeJobRow {
  id: string;
  queue_name: string;
  payload: unknown;
  context: ExecutionContext;
  attempts: number;
  maximum_attempts: number;
  state: QueueJobState;
  error: string | null;
  created_at: string;
  updated_at: string;
}

const defaultQuery: RuntimeQuery = <TRow>(
  text: string,
  params: unknown[] = [],
) => query(text, params) as Promise<TRow[]>;

function toWorkflowRecord(row: WorkflowExecutionRow): WorkflowExecutionRecord {
  return Object.freeze({
    id: row.id,
    definitionId: row.definition_id,
    businessId: row.business_id,
    context: Object.freeze(row.context),
    state: row.state,
    currentStepId: row.current_step_id,
    completedStepIds: Object.freeze(row.completed_step_ids),
    outputs: Object.freeze(row.outputs),
    error: row.error,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  });
}

function toQueueJob(row: RuntimeJobRow): QueueJob {
  return Object.freeze({
    id: row.id,
    name: row.queue_name,
    payload: row.payload,
    context: Object.freeze(row.context),
    attempts: row.attempts,
    maximumAttempts: row.maximum_attempts,
    state: row.state,
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export class PostgresWorkflowExecutionStore
  implements WorkflowExecutionStore
{
  constructor(private readonly execute: RuntimeQuery = defaultQuery) {}

  async save(record: WorkflowExecutionRecord): Promise<void> {
    await this.execute(
      `INSERT INTO workflow_executions (
         id, org_id, definition_id, business_id, context, state,
         current_step_id, completed_step_ids, outputs, error,
         started_at, updated_at, completed_at
       ) VALUES (
         $1, $2, $3, $4, $5::jsonb, $6, $7, $8::jsonb, $9::jsonb, $10, $11, $12, $13
       )
       ON CONFLICT (id) DO UPDATE SET
         state = EXCLUDED.state,
         current_step_id = EXCLUDED.current_step_id,
         completed_step_ids = EXCLUDED.completed_step_ids,
         outputs = EXCLUDED.outputs,
         error = EXCLUDED.error,
         updated_at = EXCLUDED.updated_at,
         completed_at = EXCLUDED.completed_at
       WHERE workflow_executions.org_id = EXCLUDED.org_id`,
      [
        record.id,
        record.context.orgId,
        record.definitionId,
        record.businessId,
        JSON.stringify(record.context),
        record.state,
        record.currentStepId,
        JSON.stringify(record.completedStepIds),
        JSON.stringify(record.outputs),
        record.error,
        record.startedAt,
        record.updatedAt,
        record.completedAt,
      ],
    );
  }

  async get(
    id: string,
    orgId: string,
  ): Promise<WorkflowExecutionRecord | undefined> {
    const rows = await this.execute<WorkflowExecutionRow>(
      `SELECT * FROM workflow_executions
       WHERE id = $1 AND org_id = $2 AND deleted_at IS NULL`,
      [id, orgId],
    );
    return rows[0] ? toWorkflowRecord(rows[0]) : undefined;
  }

  async list(orgId: string): Promise<readonly WorkflowExecutionRecord[]> {
    const rows = await this.execute<WorkflowExecutionRow>(
      `SELECT * FROM workflow_executions
       WHERE org_id = $1 AND deleted_at IS NULL
       ORDER BY updated_at DESC`,
      [orgId],
    );
    return Object.freeze(rows.map(toWorkflowRecord));
  }
}

export class PostgresRuntimeJobStore implements DurableRuntimeJobStore {
  constructor(private readonly execute: RuntimeQuery = defaultQuery) {}

  async enqueue<TPayload>(input: DurableJobInput<TPayload>): Promise<QueueJob> {
    const rows = await this.execute<RuntimeJobRow>(
      `INSERT INTO runtime_jobs (
         id, org_id, queue_name, payload, context, idempotency_key,
         maximum_attempts, available_at
       ) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8)
       ON CONFLICT (org_id, queue_name, idempotency_key)
         WHERE idempotency_key IS NOT NULL AND deleted_at IS NULL
       DO UPDATE SET updated_at = runtime_jobs.updated_at
       RETURNING *`,
      [
        randomUUID(),
        input.context.orgId,
        input.queueName,
        JSON.stringify(input.payload),
        JSON.stringify(input.context),
        input.idempotencyKey ?? null,
        Math.max(1, input.maximumAttempts ?? 3),
        input.availableAt ?? new Date().toISOString(),
      ],
    );
    const row = rows[0];
    if (!row) {
      throw new Error("Runtime job enqueue returned no record.");
    }
    return toQueueJob(row);
  }

  async claim(
    queueNames: readonly string[],
    workerId: string,
    leaseMilliseconds = 30_000,
  ): Promise<QueueJob | undefined> {
    if (queueNames.length === 0) {
      return undefined;
    }
    const rows = await this.execute<RuntimeJobRow>(
      `WITH candidate AS (
         SELECT id
         FROM runtime_jobs
         WHERE queue_name = ANY($1::text[])
           AND deleted_at IS NULL
           AND available_at <= now()
           AND (
             state = 'pending'
             OR (state = 'running' AND lease_expires_at < now())
           )
         ORDER BY available_at, created_at
         FOR UPDATE SKIP LOCKED
         LIMIT 1
       )
       UPDATE runtime_jobs AS job
       SET state = 'running',
           attempts = job.attempts + 1,
           lease_owner = $2,
           lease_expires_at = now() + ($3 * interval '1 millisecond'),
           updated_at = now()
       FROM candidate
       WHERE job.id = candidate.id
       RETURNING job.*`,
      [[...queueNames], workerId, Math.max(1, leaseMilliseconds)],
    );
    return rows[0] ? toQueueJob(rows[0]) : undefined;
  }

  async complete(
    orgId: string,
    jobId: string,
    workerId: string,
  ): Promise<boolean> {
    const rows = await this.execute<{ id: string }>(
      `UPDATE runtime_jobs
       SET state = 'completed',
           error = NULL,
           lease_owner = NULL,
           lease_expires_at = NULL,
           completed_at = now(),
           updated_at = now()
       WHERE id = $1 AND org_id = $2 AND state = 'running' AND lease_owner = $3
       RETURNING id`,
      [jobId, orgId, workerId],
    );
    return rows.length === 1;
  }

  async fail(
    orgId: string,
    jobId: string,
    workerId: string,
    error: string,
    retryDelayMilliseconds = 0,
  ): Promise<QueueJob | undefined> {
    const rows = await this.execute<RuntimeJobRow>(
      `UPDATE runtime_jobs
       SET state = CASE
             WHEN attempts >= maximum_attempts THEN 'dead_letter'
             ELSE 'pending'
           END,
           error = $4,
           available_at = CASE
             WHEN attempts >= maximum_attempts THEN available_at
             ELSE now() + ($5 * interval '1 millisecond')
           END,
           lease_owner = NULL,
           lease_expires_at = NULL,
           updated_at = now()
       WHERE id = $1 AND org_id = $2 AND state = 'running' AND lease_owner = $3
       RETURNING *`,
      [jobId, orgId, workerId, error, Math.max(0, retryDelayMilliseconds)],
    );
    return rows[0] ? toQueueJob(rows[0]) : undefined;
  }

  async heartbeat(
    workerId: string,
    instanceId: string,
    status: WorkerStatus,
    metadata: Readonly<Record<string, unknown>> = {},
  ): Promise<void> {
    await this.execute(
      `INSERT INTO runtime_workers (id, instance_id, status, metadata)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (id) DO UPDATE SET
         instance_id = EXCLUDED.instance_id,
         status = EXCLUDED.status,
         metadata = EXCLUDED.metadata,
         heartbeat_at = now(),
         stopped_at = CASE WHEN EXCLUDED.status = 'stopped' THEN now() ELSE NULL END`,
      [workerId, instanceId, status, JSON.stringify(metadata)],
    );
  }
}

export class PostgresRuntimeScheduleStore {
  constructor(private readonly execute: RuntimeQuery = defaultQuery) {}

  async schedule<TPayload>(
    input: DurableScheduleInput<TPayload>,
  ): Promise<string> {
    const rows = await this.execute<{ id: string }>(
      `INSERT INTO runtime_schedules (
         id, org_id, queue_name, payload, context, idempotency_key,
         run_at, recurrence_ms, maximum_attempts
       ) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8, $9)
       ON CONFLICT (org_id, queue_name, idempotency_key)
         WHERE idempotency_key IS NOT NULL AND deleted_at IS NULL
       DO UPDATE SET updated_at = runtime_schedules.updated_at
       RETURNING id`,
      [
        randomUUID(),
        input.context.orgId,
        input.queueName,
        JSON.stringify(input.payload),
        JSON.stringify(input.context),
        input.idempotencyKey ?? null,
        input.runAt,
        input.recurrenceMilliseconds ?? null,
        Math.max(1, input.maximumAttempts ?? 3),
      ],
    );
    const row = rows[0];
    if (!row) {
      throw new Error("Runtime schedule creation returned no record.");
    }
    return row.id;
  }

  async dispatchDue(limit = 100): Promise<ScheduleDispatchResult> {
    const rows = await this.execute<{
      jobs_created: number | string;
      schedules_advanced: number | string;
    }>(
      `WITH due AS (
         SELECT
           id, org_id, queue_name, payload, context, idempotency_key,
           run_at, recurrence_ms, maximum_attempts
         FROM runtime_schedules
         WHERE status = 'active'
           AND run_at <= now()
           AND deleted_at IS NULL
         ORDER BY run_at, created_at
         FOR UPDATE SKIP LOCKED
         LIMIT $1
       ),
       created AS (
         INSERT INTO runtime_jobs (
           id, org_id, queue_name, payload, context, idempotency_key,
           maximum_attempts, available_at
         )
         SELECT
           gen_random_uuid(),
           due.org_id,
           due.queue_name,
           due.payload,
           due.context,
           COALESCE(
             due.idempotency_key,
             'schedule:' || due.id::text || ':' || due.run_at::text
           ),
           due.maximum_attempts,
           due.run_at
         FROM due
         ON CONFLICT (org_id, queue_name, idempotency_key)
           WHERE idempotency_key IS NOT NULL AND deleted_at IS NULL
         DO NOTHING
         RETURNING id
       ),
       advanced AS (
         UPDATE runtime_schedules AS schedule
         SET status = CASE
               WHEN due.recurrence_ms IS NULL THEN 'completed'
               ELSE 'active'
             END,
             run_at = CASE
               WHEN due.recurrence_ms IS NULL THEN schedule.run_at
               ELSE schedule.run_at +
                 (due.recurrence_ms * interval '1 millisecond')
             END,
             updated_at = now()
         FROM due
         WHERE schedule.id = due.id
         RETURNING schedule.id
       )
       SELECT
         (SELECT count(*) FROM created) AS jobs_created,
         (SELECT count(*) FROM advanced) AS schedules_advanced`,
      [Math.max(1, limit)],
    );
    const row = rows[0];
    return Object.freeze({
      jobsCreated: Number(row?.jobs_created ?? 0),
      schedulesAdvanced: Number(row?.schedules_advanced ?? 0),
    });
  }
}

export class PostgresRuntimeWorker {
  private running = false;

  constructor(
    private readonly store: DurableRuntimeJobStore,
    private readonly workerId: string,
    private readonly instanceId: string,
    private readonly handlers: Readonly<Record<string, DurableJobHandler>>,
    private readonly leaseMilliseconds = 30_000,
  ) {}

  async start(): Promise<void> {
    await this.store.heartbeat(
      this.workerId,
      this.instanceId,
      "starting",
      { queues: Object.keys(this.handlers) },
    );
    this.running = true;
    await this.store.heartbeat(this.workerId, this.instanceId, "ready", {
      queues: Object.keys(this.handlers),
    });
  }

  async runOnce(): Promise<QueueJob | undefined> {
    if (!this.running) {
      throw new Error("Runtime worker is not running.");
    }
    await this.store.heartbeat(this.workerId, this.instanceId, "ready");
    const job = await this.store.claim(
      Object.keys(this.handlers),
      this.workerId,
      this.leaseMilliseconds,
    );
    if (!job) {
      return undefined;
    }

    const handler = this.handlers[job.name];
    try {
      if (!handler) {
        throw new Error(`No durable job handler is registered for "${job.name}".`);
      }
      await handler(job);
      const completed = await this.store.complete(
        job.context.orgId,
        job.id,
        this.workerId,
      );
      if (!completed) {
        throw new Error(`Worker lease was lost while completing job "${job.id}".`);
      }
    } catch (error) {
      await this.store.fail(
        job.context.orgId,
        job.id,
        this.workerId,
        error instanceof Error ? error.message : String(error),
      );
    }
    return job;
  }

  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }
    await this.store.heartbeat(this.workerId, this.instanceId, "draining");
    this.running = false;
    await this.store.heartbeat(this.workerId, this.instanceId, "stopped");
  }
}

export class PostgresEventJournal implements EventJournal {
  constructor(private readonly execute: RuntimeQuery = defaultQuery) {}

  async record(event: RoutedBossEvent): Promise<void> {
    await this.execute(
      `INSERT INTO runtime_events (
         id, org_id, event_type, payload, context,
         correlation_id, trace_id, published_at
       ) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        event.id,
        event.context.orgId,
        event.type,
        JSON.stringify(event.payload),
        JSON.stringify(event.context),
        event.context.correlationId,
        event.context.traceId,
        event.occurredAt,
      ],
    );
  }
}

export class JournaledEventBus implements EventBus {
  constructor(
    private readonly delegate: EventBus,
    private readonly journal: EventJournal,
  ) {}

  subscribe<TPayload>(
    type: string,
    handler: (event: BossEvent<TPayload>) => void | Promise<void>,
  ): void {
    this.delegate.subscribe(type, handler);
  }

  async publish<TPayload>(event: BossEvent<TPayload>): Promise<void> {
    if (!event.context) {
      throw new Error(`Event "${event.type}" is missing tenant and trace context.`);
    }
    const durableEvent: RoutedBossEvent<TPayload> = Object.freeze({
      ...event,
      id: event.id ?? randomUUID(),
      context: event.context,
    });
    await this.journal.record(durableEvent);
    await this.delegate.publish(durableEvent);
  }
}

export class PostgresAgentExecutionSink implements AgentExecutionSink {
  constructor(private readonly execute: RuntimeQuery = defaultQuery) {}

  async record(execution: AgentExecution): Promise<void> {
    await this.execute(
      `INSERT INTO agent_executions (
         id, org_id, agent_id, context, state, output, error,
         started_at, updated_at, completed_at
       ) VALUES ($1, $2, $3, $4::jsonb, $5, $6::jsonb, $7, $8, $9, $9)
       ON CONFLICT (id) DO UPDATE SET
         state = EXCLUDED.state,
         output = EXCLUDED.output,
         error = EXCLUDED.error,
         updated_at = EXCLUDED.updated_at,
         completed_at = EXCLUDED.completed_at
       WHERE agent_executions.org_id = EXCLUDED.org_id`,
      [
        execution.id,
        execution.context.orgId,
        execution.agentId,
        JSON.stringify(execution.context),
        execution.state,
        JSON.stringify(execution.output),
        execution.error,
        execution.startedAt,
        execution.completedAt,
      ],
    );
  }
}
