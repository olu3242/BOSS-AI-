import { randomUUID } from "node:crypto";
import { query } from "@boss/db";

export type AuditOutcome = "success" | "failure" | "denied";

export interface AuditEvent {
  id: string;
  traceId: string;
  orgId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  outcome: AuditOutcome;
  metadata: Record<string, unknown>;
  occurredAt: string;
}

export interface StructuredLog {
  level: "info" | "warn" | "error";
  traceId: string;
  message: string;
  context: Record<string, unknown>;
  occurredAt: string;
}

export interface OperationMetric {
  name: string;
  traceId: string;
  durationMs: number;
  success: boolean;
  occurredAt: string;
}

export interface AuditSink {
  record(event: AuditEvent): void | Promise<void>;
}

export function createTraceId(): string {
  return randomUUID();
}

export function createAuditEvent(input: Omit<AuditEvent, "id" | "occurredAt">): AuditEvent {
  return {
    id: randomUUID(),
    occurredAt: new Date().toISOString(),
    ...input,
  };
}

export function createStructuredLog(input: Omit<StructuredLog, "occurredAt">): StructuredLog {
  return {
    occurredAt: new Date().toISOString(),
    ...input,
  };
}

export class InMemoryAuditSink {
  private readonly events: AuditEvent[] = [];

  record(event: AuditEvent): void {
    this.events.push(event);
  }

  list(orgId: string): AuditEvent[] {
    return this.events.filter((event) => event.orgId === orgId);
  }
}

function optionalMetadataString(
  metadata: Record<string, unknown>,
  key: string,
): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function organizationId(orgId: string): string | null {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    orgId,
  )
    ? orgId
    : null;
}

export class PostgresAuditSink implements AuditSink {
  async record(event: AuditEvent): Promise<void> {
    await query(
      `INSERT INTO identity_audit_events (
         id, tenant_id, organization_id, actor_id, action, resource_type,
         resource_id, outcome, trace_id, request_id, correlation_id, metadata,
         occurred_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13
       )`,
      [
        event.id,
        event.orgId,
        organizationId(event.orgId),
        event.actorId,
        event.action,
        event.resourceType,
        event.resourceId,
        event.outcome,
        event.traceId,
        optionalMetadataString(event.metadata, "requestId"),
        optionalMetadataString(event.metadata, "correlationId"),
        JSON.stringify(event.metadata),
        event.occurredAt,
      ],
    );
  }
}

export async function measureOperation<T>(
  name: string,
  traceId: string,
  operation: () => Promise<T>
): Promise<{ result: T; metric: OperationMetric }> {
  const startedAt = performance.now();
  try {
    const result = await operation();
    return {
      result,
      metric: {
        name,
        traceId,
        durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
        success: true,
        occurredAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    const metric: OperationMetric = {
      name,
      traceId,
      durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
      success: false,
      occurredAt: new Date().toISOString(),
    };
    Object.assign(error as object, { metric });
    throw error;
  }
}
