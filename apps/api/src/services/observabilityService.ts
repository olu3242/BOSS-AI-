import { nowIso } from "@boss/shared";
import type { RepositoryContainer } from "../container.js";

export interface MetricSnapshot {
  capturedAt: string;
  uptimeMs: number;
  memoryMb: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  counters: {
    httpRequests: number;
    httpErrors: number;
    workflowsExecuted: number;
    toolExecutions: number;
    schedulerJobsExecuted: number;
    circuitBreakersOpened: number;
    providerEvidenceRecorded: number;
  };
  latency: {
    httpRequestsP50Ms: number;
    httpRequestsP95Ms: number;
  };
}

export interface ObservabilityService {
  recordRequest(latencyMs: number, isError: boolean): void;
  getSnapshot(): MetricSnapshot;
  /** Subscribe to domain events on the eventBus to auto-increment counters. */
  attachToEventBus(repos: Pick<RepositoryContainer, "eventBus">): void;
}

const startTime = Date.now();

export function createObservabilityService(): ObservabilityService {
  const counters = {
    httpRequests: 0,
    httpErrors: 0,
    workflowsExecuted: 0,
    toolExecutions: 0,
    schedulerJobsExecuted: 0,
    circuitBreakersOpened: 0,
    providerEvidenceRecorded: 0,
  };

  // Ring buffer of recent HTTP latencies for percentile estimation
  const latencyBuffer: number[] = [];
  const BUFFER_SIZE = 500;

  function addLatency(ms: number) {
    latencyBuffer.push(ms);
    if (latencyBuffer.length > BUFFER_SIZE) latencyBuffer.shift();
  }

  function percentile(p: number): number {
    if (latencyBuffer.length === 0) return 0;
    const sorted = [...latencyBuffer].sort((a, b) => a - b);
    const idx = Math.max(0, Math.floor((p / 100) * sorted.length) - 1);
    return sorted[idx] ?? 0;
  }

  return {
    recordRequest(latencyMs, isError) {
      counters.httpRequests += 1;
      if (isError) counters.httpErrors += 1;
      addLatency(latencyMs);
    },

    getSnapshot(): MetricSnapshot {
      const mem = process.memoryUsage();
      return {
        capturedAt: nowIso(),
        uptimeMs: Date.now() - startTime,
        memoryMb: {
          rss: Math.round(mem.rss / 1024 / 1024),
          heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        },
        counters: { ...counters },
        latency: {
          httpRequestsP50Ms: Math.round(percentile(50)),
          httpRequestsP95Ms: Math.round(percentile(95)),
        },
      };
    },

    attachToEventBus(repos) {
      repos.eventBus.subscribe("execution.completed", () => { counters.workflowsExecuted += 1; });
      repos.eventBus.subscribe("execution.failed", () => { counters.workflowsExecuted += 1; });
      repos.eventBus.subscribe("tool.execution.succeeded", () => { counters.toolExecutions += 1; });
      repos.eventBus.subscribe("tool.execution.failed", () => { counters.toolExecutions += 1; });
      repos.eventBus.subscribe("scheduler.job.executed", () => { counters.schedulerJobsExecuted += 1; });
      repos.eventBus.subscribe("tool.circuit.opened", () => { counters.circuitBreakersOpened += 1; });
      repos.eventBus.subscribe("tool.evidence.persisted", () => { counters.providerEvidenceRecorded += 1; });
    },
  };
}
