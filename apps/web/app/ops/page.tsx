/**
 * Internal operations dashboard — not linked from customer-facing UI.
 * Accessible at /ops for engineering and operations teams.
 * Consumes GET /health and GET /metrics without authentication.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

interface HealthResponse {
  status: string;
  version: string;
  checks: {
    api: string;
    errorRate: string;
    heapMb: number;
    uptimeMs: number;
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
  memoryMb: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  capturedAt: string;
}

async function getHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as HealthResponse) : null;
  } catch {
    return null;
  }
}

async function getFlags(): Promise<Record<string, boolean> | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/flags`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as Record<string, boolean>) : null;
  } catch {
    return null;
  }
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded border border-border bg-surface p-4">
      <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-text-muted">{sub}</p>}
    </div>
  );
}

export default async function OpsPage() {
  const [health, flags] = await Promise.all([getHealth(), getFlags()]);

  const uptime = health
    ? (() => {
        const s = Math.floor(health.checks.uptimeMs / 1000);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        return `${h}h ${m}m`;
      })()
    : "—";

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-muted">Internal Operations Dashboard</p>
          <h1 className="mt-1 font-display text-3xl">BOSS Platform Status</h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              health?.status === "ok" ? "bg-green-500" : health ? "bg-yellow-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm font-medium">
            {health?.status === "ok" ? "Operational" : health ? "Degraded" : "Offline"}
          </span>
        </div>
      </div>

      {/* Platform info */}
      <div className="flex gap-4 text-xs text-text-muted">
        <span>Version: <span className="text-text-secondary">{health?.version ?? "—"}</span></span>
        <span>Uptime: <span className="text-text-secondary">{uptime}</span></span>
        <span>Captured: <span className="text-text-secondary">{health ? new Date(health.capturedAt).toLocaleString() : "—"}</span></span>
      </div>

      {/* API health */}
      <section>
        <h2 className="mb-3 font-display text-lg text-text-secondary">API Health</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Error Rate" value={health?.checks.errorRate ?? "—"} />
          <Stat label="P50 Latency" value={health ? `${health.latency.httpRequestsP50Ms}ms` : "—"} />
          <Stat label="P95 Latency" value={health ? `${health.latency.httpRequestsP95Ms}ms` : "—"} />
          <Stat label="Heap Used" value={health ? `${health.memoryMb.heapUsed}MB` : "—"} sub={`of ${health?.memoryMb.heapTotal ?? "?"}MB total`} />
        </div>
      </section>

      {/* Counters */}
      <section>
        <h2 className="mb-3 font-display text-lg text-text-secondary">Platform Counters</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="HTTP Requests" value={health?.counters.httpRequests ?? "—"} />
          <Stat label="HTTP Errors" value={health?.counters.httpErrors ?? "—"} />
          <Stat label="Workflows Executed" value={health?.counters.workflowsExecuted ?? "—"} />
          <Stat label="Tool Executions" value={health?.counters.toolExecutions ?? "—"} />
          <Stat label="Scheduler Jobs" value={health?.counters.schedulerJobsExecuted ?? "—"} />
          <Stat label="Circuit Breakers Opened" value={health?.counters.circuitBreakersOpened ?? "—"} />
          <Stat label="Provider Evidence" value={health?.counters.providerEvidenceRecorded ?? "—"} />
        </div>
      </section>

      {/* Memory */}
      <section>
        <h2 className="mb-3 font-display text-lg text-text-secondary">Memory</h2>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="RSS" value={health ? `${health.memoryMb.rss}MB` : "—"} />
          <Stat label="Heap Used" value={health ? `${health.memoryMb.heapUsed}MB` : "—"} />
          <Stat label="Heap Total" value={health ? `${health.memoryMb.heapTotal}MB` : "—"} />
        </div>
      </section>

      {/* Feature flags */}
      <section>
        <h2 className="mb-3 font-display text-lg text-text-secondary">Feature Flags</h2>
        {flags ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(flags).map(([flag, enabled]) => (
              <div key={flag} className="flex items-center justify-between rounded border border-border bg-surface px-3 py-2">
                <span className="text-sm font-mono text-text-secondary">{flag}</span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${enabled ? "bg-green-900/50 text-green-400" : "bg-elevated text-text-muted"}`}>
                  {enabled ? "on" : "off"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">Could not load feature flags.</p>
        )}
      </section>

      {!health && (
        <div className="rounded border border-red-800 bg-red-950/30 p-4 text-red-400">
          <p className="font-medium">API Unreachable</p>
          <p className="mt-1 text-sm">Could not connect to {API_BASE_URL}/health. Ensure the API is running.</p>
        </div>
      )}
    </main>
  );
}
