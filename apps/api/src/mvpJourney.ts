import { randomUUID } from "node:crypto";
import { query } from "@boss/db";

export const MVP_JOURNEY_STAGES = [
  "landing_viewed",
  "signup_completed",
  "organization_created",
  "business_profile_completed",
  "diagnostic_completed",
  "health_score_viewed",
  "problems_viewed",
  "plan_generated",
  "plan_approved",
  "workflow_created",
  "agent_executed",
  "automation_completed",
  "first_value_visible",
] as const;

export type MvpJourneyStage = (typeof MVP_JOURNEY_STAGES)[number];

export interface MvpJourneyEvent {
  readonly id: string;
  readonly journeyId: string;
  readonly stage: MvpJourneyStage;
  readonly orgId: string | null;
  readonly actorId: string | null;
  readonly businessId: string | null;
  readonly traceId: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly occurredAt: string;
}

export interface MvpJourneyStore {
  append(event: MvpJourneyEvent): Promise<boolean>;
  list(journeyId: string): Promise<readonly MvpJourneyEvent[]>;
}

export interface MvpJourneyReport {
  readonly journeyId: string;
  readonly currentStage: MvpJourneyStage | null;
  readonly nextStage: MvpJourneyStage | null;
  readonly completed: boolean;
  readonly startedAt: string | null;
  readonly firstValueAt: string | null;
  readonly elapsedMilliseconds: number | null;
  readonly targetMilliseconds: number;
  readonly withinTarget: boolean | null;
  readonly stagesCompleted: number;
  readonly totalStages: number;
}

export interface JourneyQuery {
  <TRow>(text: string, params?: unknown[]): Promise<TRow[]>;
}

interface JourneyRow {
  id: string;
  journey_id: string;
  stage: MvpJourneyStage;
  org_id: string | null;
  actor_id: string | null;
  business_id: string | null;
  trace_id: string;
  metadata: Record<string, unknown>;
  occurred_at: string;
}

const defaultQuery: JourneyQuery = <TRow>(
  text: string,
  params: unknown[] = [],
) => query(text, params) as Promise<TRow[]>;

function toEvent(row: JourneyRow): MvpJourneyEvent {
  return Object.freeze({
    id: row.id,
    journeyId: row.journey_id,
    stage: row.stage,
    orgId: row.org_id,
    actorId: row.actor_id,
    businessId: row.business_id,
    traceId: row.trace_id,
    metadata: Object.freeze(row.metadata),
    occurredAt: row.occurred_at,
  });
}

export class InMemoryMvpJourneyStore implements MvpJourneyStore {
  private readonly events = new Map<string, MvpJourneyEvent>();

  async append(event: MvpJourneyEvent): Promise<boolean> {
    const key = `${event.journeyId}:${event.stage}`;
    if (this.events.has(key)) {
      return false;
    }
    this.events.set(key, Object.freeze(event));
    return true;
  }

  async list(journeyId: string): Promise<readonly MvpJourneyEvent[]> {
    return Object.freeze(
      Array.from(this.events.values())
        .filter((event) => event.journeyId === journeyId)
        .sort(
          (left, right) =>
            MVP_JOURNEY_STAGES.indexOf(left.stage) -
            MVP_JOURNEY_STAGES.indexOf(right.stage),
        ),
    );
  }
}

export class PostgresMvpJourneyStore implements MvpJourneyStore {
  constructor(private readonly execute: JourneyQuery = defaultQuery) {}

  async append(event: MvpJourneyEvent): Promise<boolean> {
    const rows = await this.execute<{ id: string }>(
      `INSERT INTO mvp_journey_events (
         id, journey_id, org_id, actor_id, business_id, trace_id,
         stage, metadata, occurred_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
       ON CONFLICT (journey_id, stage) DO NOTHING
       RETURNING id`,
      [
        event.id,
        event.journeyId,
        event.orgId,
        event.actorId,
        event.businessId,
        event.traceId,
        event.stage,
        JSON.stringify(event.metadata),
        event.occurredAt,
      ],
    );
    return rows.length === 1;
  }

  async list(journeyId: string): Promise<readonly MvpJourneyEvent[]> {
    const rows = await this.execute<JourneyRow>(
      `SELECT * FROM mvp_journey_events
       WHERE journey_id = $1
       ORDER BY occurred_at, created_at`,
      [journeyId],
    );
    return Object.freeze(rows.map(toEvent));
  }
}

export class MvpJourneyTracker {
  constructor(
    private readonly store: MvpJourneyStore,
    private readonly now: () => Date = () => new Date(),
    private readonly targetMilliseconds = 20 * 60 * 1_000,
  ) {}

  async record(
    journeyId: string,
    stage: MvpJourneyStage,
    context: {
      readonly traceId: string;
      readonly orgId?: string;
      readonly actorId?: string;
      readonly businessId?: string;
      readonly metadata?: Readonly<Record<string, unknown>>;
    },
  ): Promise<MvpJourneyReport> {
    const events = await this.store.list(journeyId);
    const existing = events.find((event) => event.stage === stage);
    if (existing) {
      return this.createReport(journeyId, events);
    }

    const expectedStage = MVP_JOURNEY_STAGES[events.length];
    if (stage !== expectedStage) {
      throw new Error(
        `MVP journey "${journeyId}" expected stage "${expectedStage ?? "complete"}" but received "${stage}".`,
      );
    }

    await this.store.append({
      id: randomUUID(),
      journeyId,
      stage,
      orgId: context.orgId ?? null,
      actorId: context.actorId ?? null,
      businessId: context.businessId ?? null,
      traceId: context.traceId,
      metadata: Object.freeze({ ...(context.metadata ?? {}) }),
      occurredAt: this.now().toISOString(),
    });
    return this.createReport(journeyId, await this.store.list(journeyId));
  }

  async report(journeyId: string): Promise<MvpJourneyReport> {
    return this.createReport(journeyId, await this.store.list(journeyId));
  }

  private createReport(
    journeyId: string,
    events: readonly MvpJourneyEvent[],
  ): MvpJourneyReport {
    const startedAt = events[0]?.occurredAt ?? null;
    const last = events.at(-1);
    const completed = last?.stage === "first_value_visible";
    const firstValueAt = completed ? last.occurredAt : null;
    const elapsedMilliseconds =
      startedAt && firstValueAt
        ? Math.max(0, Date.parse(firstValueAt) - Date.parse(startedAt))
        : null;
    return Object.freeze({
      journeyId,
      currentStage: last?.stage ?? null,
      nextStage: MVP_JOURNEY_STAGES[events.length] ?? null,
      completed,
      startedAt,
      firstValueAt,
      elapsedMilliseconds,
      targetMilliseconds: this.targetMilliseconds,
      withinTarget:
        elapsedMilliseconds === null
          ? null
          : elapsedMilliseconds <= this.targetMilliseconds,
      stagesCompleted: events.length,
      totalStages: MVP_JOURNEY_STAGES.length,
    });
  }
}
