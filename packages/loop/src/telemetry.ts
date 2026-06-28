import type {
  ExecutionContext,
  RuntimeLog,
  RuntimeMetric,
} from "./runtimeTypes.js";

export interface RuntimeTelemetry {
  log(
    level: RuntimeLog["level"],
    message: string,
    context: ExecutionContext,
    metadata?: Readonly<Record<string, unknown>>,
  ): void;
  metric(
    name: string,
    value: number,
    unit: RuntimeMetric["unit"],
    context: ExecutionContext,
    tags?: Readonly<Record<string, string>>,
  ): void;
}

export class InMemoryRuntimeTelemetry implements RuntimeTelemetry {
  private readonly runtimeLogs: RuntimeLog[] = [];
  private readonly runtimeMetrics: RuntimeMetric[] = [];

  log(
    level: RuntimeLog["level"],
    message: string,
    context: ExecutionContext,
    metadata: Readonly<Record<string, unknown>> = {},
  ): void {
    this.runtimeLogs.push(
      Object.freeze({
        level,
        message,
        context,
        metadata,
        occurredAt: new Date().toISOString(),
      }),
    );
  }

  metric(
    name: string,
    value: number,
    unit: RuntimeMetric["unit"],
    context: ExecutionContext,
    tags: Readonly<Record<string, string>> = {},
  ): void {
    this.runtimeMetrics.push(
      Object.freeze({
        name,
        value,
        unit,
        context,
        tags,
        occurredAt: new Date().toISOString(),
      }),
    );
  }

  logs(): readonly RuntimeLog[] {
    return Object.freeze([...this.runtimeLogs]);
  }

  metrics(): readonly RuntimeMetric[] {
    return Object.freeze([...this.runtimeMetrics]);
  }
}
