/**
 * Serializes a MetricSnapshot into the Prometheus exposition text format
 * (text/plain; version=0.0.4) so Prometheus, Grafana Cloud, and OTEL
 * collectors can scrape it without any SDK dependency.
 *
 * Spec: https://prometheus.io/docs/instrumenting/exposition_formats/
 */
import type { MetricSnapshot } from "../services/observabilityService.js";

function gauge(name: string, value: number, help: string, labels?: Record<string, string>): string {
  const labelStr = labels
    ? `{${Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(",")}}`
    : "";
  return `# HELP ${name} ${help}\n# TYPE ${name} gauge\n${name}${labelStr} ${value}\n`;
}

function counter(name: string, value: number, help: string): string {
  return `# HELP ${name} ${help}\n# TYPE ${name} counter\n${name}_total ${value}\n`;
}

export function snapshotToPrometheus(snap: MetricSnapshot): string {
  const lines: string[] = [];

  lines.push(gauge("boss_uptime_ms", snap.uptimeMs, "Process uptime in milliseconds"));

  lines.push(gauge("boss_memory_rss_mb", snap.memoryMb.rss, "Resident set size in MiB"));
  lines.push(gauge("boss_memory_heap_used_mb", snap.memoryMb.heapUsed, "V8 heap used in MiB"));
  lines.push(gauge("boss_memory_heap_total_mb", snap.memoryMb.heapTotal, "V8 heap total in MiB"));

  lines.push(counter("boss_http_requests", snap.counters.httpRequests, "Total HTTP requests handled"));
  lines.push(counter("boss_http_errors", snap.counters.httpErrors, "Total HTTP requests that resulted in an error"));
  lines.push(counter("boss_workflows_executed", snap.counters.workflowsExecuted, "Total workflow executions completed or failed"));
  lines.push(counter("boss_tool_executions", snap.counters.toolExecutions, "Total tool executions (succeeded + failed)"));
  lines.push(counter("boss_scheduler_jobs_executed", snap.counters.schedulerJobsExecuted, "Total scheduler jobs that ran"));
  lines.push(counter("boss_circuit_breakers_opened", snap.counters.circuitBreakersOpened, "Total circuit breaker open events"));
  lines.push(counter("boss_provider_evidence_recorded", snap.counters.providerEvidenceRecorded, "Total provider evidence records persisted"));

  lines.push(gauge("boss_http_latency_p50_ms", snap.latency.httpRequestsP50Ms, "HTTP request latency p50 in milliseconds"));
  lines.push(gauge("boss_http_latency_p95_ms", snap.latency.httpRequestsP95Ms, "HTTP request latency p95 in milliseconds"));

  return lines.join("\n");
}
