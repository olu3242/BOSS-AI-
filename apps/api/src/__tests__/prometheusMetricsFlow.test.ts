import { describe, it, expect } from "vitest";
import { snapshotToPrometheus } from "../http/prometheusFormat.js";
import type { MetricSnapshot } from "../services/observabilityService.js";

const SAMPLE_SNAP: MetricSnapshot = {
  capturedAt: "2026-07-06T00:00:00.000Z",
  uptimeMs: 300_000,
  memoryMb: { rss: 128, heapUsed: 64, heapTotal: 80 },
  counters: {
    httpRequests: 5000,
    httpErrors: 12,
    workflowsExecuted: 300,
    toolExecutions: 900,
    schedulerJobsExecuted: 150,
    circuitBreakersOpened: 2,
    providerEvidenceRecorded: 450,
  },
  latency: { httpRequestsP50Ms: 45, httpRequestsP95Ms: 210 },
};

describe("snapshotToPrometheus", () => {
  it("produces valid Prometheus text format with TYPE and HELP lines", () => {
    const output = snapshotToPrometheus(SAMPLE_SNAP);

    // Every metric must have # HELP and # TYPE lines
    expect(output).toContain("# HELP boss_uptime_ms");
    expect(output).toContain("# TYPE boss_uptime_ms gauge");
    expect(output).toContain("boss_uptime_ms 300000");

    expect(output).toContain("# TYPE boss_http_requests counter");
    expect(output).toContain("boss_http_requests_total 5000");

    expect(output).toContain("boss_http_errors_total 12");
    expect(output).toContain("boss_workflows_executed_total 300");
    expect(output).toContain("boss_tool_executions_total 900");
    expect(output).toContain("boss_scheduler_jobs_executed_total 150");
    expect(output).toContain("boss_circuit_breakers_opened_total 2");
    expect(output).toContain("boss_provider_evidence_recorded_total 450");
  });

  it("includes memory gauges in MiB", () => {
    const output = snapshotToPrometheus(SAMPLE_SNAP);
    expect(output).toContain("boss_memory_rss_mb 128");
    expect(output).toContain("boss_memory_heap_used_mb 64");
    expect(output).toContain("boss_memory_heap_total_mb 80");
  });

  it("includes latency gauges", () => {
    const output = snapshotToPrometheus(SAMPLE_SNAP);
    expect(output).toContain("boss_http_latency_p50_ms 45");
    expect(output).toContain("boss_http_latency_p95_ms 210");
  });

  it("counter names end in _total per Prometheus convention", () => {
    const output = snapshotToPrometheus(SAMPLE_SNAP);
    // Ensure we don't accidentally omit _total from any counter
    const counterBlocks = output.split("\n# TYPE").slice(1);
    for (const block of counterBlocks) {
      if (block.includes("counter")) {
        // The metric line (after HELP/TYPE) should contain _total
        expect(block).toMatch(/_total \d+/);
      }
    }
  });

  it("zero-value counters are still emitted", () => {
    const snap: MetricSnapshot = {
      ...SAMPLE_SNAP,
      counters: {
        httpRequests: 0,
        httpErrors: 0,
        workflowsExecuted: 0,
        toolExecutions: 0,
        schedulerJobsExecuted: 0,
        circuitBreakersOpened: 0,
        providerEvidenceRecorded: 0,
      },
    };
    const output = snapshotToPrometheus(snap);
    expect(output).toContain("boss_http_requests_total 0");
    expect(output).toContain("boss_http_errors_total 0");
  });
});
