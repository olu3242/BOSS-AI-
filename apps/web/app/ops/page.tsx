/**
 * Platform Super Admin Dashboard — internal only, not linked from customer UI.
 * Accessible at /ops for platform engineering and operations teams.
 * Gated by NEXT_PUBLIC_STATIC_TOKEN in API requests.
 */

import { getApiBaseUrl } from "@boss/config";

function apiBase(): string {
  return getApiBaseUrl();
}

function authHeaders(): HeadersInit {
  const token = process.env.NEXT_PUBLIC_STATIC_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Data loaders ──────────────────────────────────────────────────────────────

interface HealthResponse {
  status: string;
  version: string;
  checks: { api: string; errorRate: string; heapMb: number; uptimeMs: number };
  counters: {
    httpRequests: number;
    httpErrors: number;
    workflowsExecuted: number;
    toolExecutions: number;
    schedulerJobsExecuted: number;
    circuitBreakersOpened: number;
    providerEvidenceRecorded: number;
  };
  latency: { httpRequestsP50Ms: number; httpRequestsP95Ms: number };
  memoryMb: { rss: number; heapUsed: number; heapTotal: number };
  capturedAt: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  created_at: string;
}

interface AuditEvent {
  id: string;
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  outcome: string;
  occurred_at: string;
}

interface ConfigDiagnostics {
  database: { host: string; port: number; ssl: boolean; isLocal: boolean };
  supabase: { host: string; anonKeyPresent: boolean; serviceRoleKeyPresent: boolean };
  api: { baseUrl: string; staticTokenPresent: boolean };
  isProduction: boolean;
  isDemoMode: boolean;
}

async function getHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${apiBase()}/health`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as HealthResponse) : null;
  } catch {
    return null;
  }
}

async function getOrganizations(): Promise<Organization[]> {
  try {
    const res = await fetch(`${apiBase()}/api/v1/platform/organizations`, {
      cache: "no-store",
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { organizations: Organization[] };
    return body.organizations ?? [];
  } catch {
    return [];
  }
}

async function getAuditEvents(): Promise<AuditEvent[]> {
  try {
    const res = await fetch(`${apiBase()}/api/v1/platform/audit`, {
      cache: "no-store",
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { events: AuditEvent[] };
    return body.events ?? [];
  } catch {
    return [];
  }
}

async function getConfigDiagnostics(): Promise<ConfigDiagnostics | null> {
  try {
    const res = await fetch(`${apiBase()}/api/v1/platform/config`, {
      cache: "no-store",
      headers: authHeaders(),
    });
    return res.ok ? ((await res.json()) as ConfigDiagnostics) : null;
  } catch {
    return null;
  }
}

async function getFlags(): Promise<Record<string, boolean> | null> {
  try {
    const res = await fetch(`${apiBase()}/api/v1/flags`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as Record<string, boolean>) : null;
  } catch {
    return null;
  }
}

// ── Components ────────────────────────────────────────────────────────────────

function Stat({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="rounded border border-border bg-surface p-4">
      <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ?? "text-text-primary"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-text-muted">{sub}</p>}
    </div>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={ok ? "text-green-400" : "text-red-400"}>{ok ? "✓" : "✗"}</span>
      <span className={ok ? "text-text-secondary" : "text-red-400"}>{label}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function OpsPage() {
  const [health, orgs, auditEvents, config, flags] = await Promise.all([
    getHealth(),
    getOrganizations(),
    getAuditEvents(),
    getConfigDiagnostics(),
    getFlags(),
  ]);

  const uptime = health
    ? (() => {
        const s = Math.floor(health.checks.uptimeMs / 1000);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        return `${h}h ${m}m`;
      })()
    : "—";

  const activeOrgs = orgs.filter((o) => o.status === "active" || o.status === "trial").length;
  const suspendedOrgs = orgs.filter((o) => o.status === "suspended").length;

  const orgStatusColors: Record<string, string> = {
    active: "bg-green-900/40 text-green-400",
    trial: "bg-blue-900/40 text-blue-400",
    suspended: "bg-red-900/40 text-red-400",
  };

  const auditOutcomeColors: Record<string, string> = {
    success: "text-green-400",
    failure: "text-red-400",
    denied: "text-yellow-400",
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-muted">Platform Super Admin</p>
          <h1 className="mt-1 font-display text-3xl">BOSS Command Center</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${
            health?.status === "ok" ? "bg-green-500" : health ? "bg-yellow-500" : "bg-red-500"
          }`} />
          <span className="text-sm font-medium">
            {health?.status === "ok" ? "Operational" : health ? "Degraded" : "API Offline"}
          </span>
          <span className="ml-4 text-xs text-text-muted">
            v{health?.version ?? "—"} · up {uptime}
          </span>
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg text-text-secondary">Platform Overview</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total Orgs" value={orgs.length} />
          <Stat label="Active / Trial" value={activeOrgs} accent="text-green-400" />
          <Stat label="Suspended" value={suspendedOrgs} accent={suspendedOrgs > 0 ? "text-red-400" : "text-text-primary"} />
          <Stat label="HTTP Requests" value={health?.counters.httpRequests ?? "—"} />
          <Stat label="Error Rate" value={health?.checks.errorRate ?? "—"} />
          <Stat label="P50 Latency" value={health ? `${health.latency.httpRequestsP50Ms}ms` : "—"} />
          <Stat label="P95 Latency" value={health ? `${health.latency.httpRequestsP95Ms}ms` : "—"} />
          <Stat label="Heap Used" value={health ? `${health.memoryMb.heapUsed}MB` : "—"} sub={health ? `of ${health.memoryMb.heapTotal}MB` : undefined} />
        </div>
      </section>

      {config && (
        <section>
          <h2 className="mb-3 font-display text-lg text-text-secondary">Configuration Health</h2>
          <div className="rounded border border-border bg-surface p-5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Check ok={config.database.ssl} label={`Database SSL: ${config.database.ssl ? "enabled" : "DISABLED"}`} />
              <Check ok={!config.database.isLocal} label={`Database host: ${config.database.host}:${config.database.port}`} />
              <Check ok={config.supabase.anonKeyPresent} label={`Supabase anon key: ${config.supabase.anonKeyPresent ? "set" : "MISSING"}`} />
              <Check ok={!!config.supabase.serviceRoleKeyPresent} label={`Supabase service role: ${config.supabase.serviceRoleKeyPresent ? "set" : "MISSING"}`} />
              <Check ok={true} label={`Supabase host: ${config.supabase.host}`} />
              <Check ok={config.isProduction} label={`Environment: ${config.isProduction ? "production" : "development"}`} />
            </div>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-lg text-text-secondary">
          Organization Management
          <span className="ml-2 text-sm font-normal text-text-muted">({orgs.length} total)</span>
        </h2>
        {orgs.length === 0 ? (
          <div className="rounded border border-border bg-surface p-8 text-center text-text-muted">
            No organizations visible. Requires super admin JWT in NEXT_PUBLIC_STATIC_TOKEN.
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-elevated">
                  <th className="px-4 py-2 text-left text-xs uppercase tracking-wide text-text-muted">Name</th>
                  <th className="px-4 py-2 text-left text-xs uppercase tracking-wide text-text-muted">Slug</th>
                  <th className="px-4 py-2 text-left text-xs uppercase tracking-wide text-text-muted">Plan</th>
                  <th className="px-4 py-2 text-left text-xs uppercase tracking-wide text-text-muted">Status</th>
                  <th className="px-4 py-2 text-left text-xs uppercase tracking-wide text-text-muted">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {orgs.map((org) => (
                  <tr key={org.id} className="hover:bg-elevated transition-colors">
                    <td className="px-4 py-2 font-medium text-text-primary">{org.name}</td>
                    <td className="px-4 py-2 font-mono text-xs text-text-muted">{org.slug}</td>
                    <td className="px-4 py-2 text-text-secondary capitalize">{org.plan}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${orgStatusColors[org.status] ?? "bg-elevated text-text-muted"}`}>
                        {org.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-text-muted">
                      {new Date(org.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg text-text-secondary">Runtime Operations</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Workflows Executed" value={health?.counters.workflowsExecuted ?? "—"} />
          <Stat label="Tool Executions" value={health?.counters.toolExecutions ?? "—"} />
          <Stat label="Scheduler Jobs" value={health?.counters.schedulerJobsExecuted ?? "—"} />
          <Stat label="Circuit Breakers" value={health?.counters.circuitBreakersOpened ?? "—"} />
          <Stat label="Provider Evidence" value={health?.counters.providerEvidenceRecorded ?? "—"} />
          <Stat label="HTTP Errors" value={health?.counters.httpErrors ?? "—"} accent={(health?.counters.httpErrors ?? 0) > 10 ? "text-red-400" : undefined} />
          <Stat label="RSS" value={health ? `${health.memoryMb.rss}MB` : "—"} />
          <Stat label="Heap Total" value={health ? `${health.memoryMb.heapTotal}MB` : "—"} />
        </div>
      </section>

      {flags && (
        <section>
          <h2 className="mb-3 font-display text-lg text-text-secondary">Feature Flags</h2>
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
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-lg text-text-secondary">
          Platform Audit Log
          <span className="ml-2 text-sm font-normal text-text-muted">(most recent 200)</span>
        </h2>
        {auditEvents.length === 0 ? (
          <div className="rounded border border-border bg-surface p-6 text-center text-text-muted">
            No audit events. Requires super admin JWT in NEXT_PUBLIC_STATIC_TOKEN.
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-elevated">
                  <th className="px-4 py-2 text-left text-xs uppercase tracking-wide text-text-muted">Time</th>
                  <th className="px-4 py-2 text-left text-xs uppercase tracking-wide text-text-muted">Actor</th>
                  <th className="px-4 py-2 text-left text-xs uppercase tracking-wide text-text-muted">Action</th>
                  <th className="px-4 py-2 text-left text-xs uppercase tracking-wide text-text-muted">Resource</th>
                  <th className="px-4 py-2 text-left text-xs uppercase tracking-wide text-text-muted">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {auditEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-elevated transition-colors">
                    <td className="px-4 py-2 text-xs text-text-muted whitespace-nowrap">
                      {new Date(ev.occurred_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-text-secondary truncate max-w-xs" title={ev.actor_id}>
                      {ev.actor_id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-text-secondary">{ev.action}</td>
                    <td className="px-4 py-2 text-xs text-text-muted">
                      {ev.resource_type}{ev.resource_id ? `:${ev.resource_id.slice(0, 8)}` : ""}
                    </td>
                    <td className={`px-4 py-2 text-xs font-medium ${auditOutcomeColors[ev.outcome] ?? "text-text-muted"}`}>
                      {ev.outcome}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg text-text-secondary">Super Admin Bootstrap</h2>
        <div className="rounded border border-border bg-surface p-5 text-sm text-text-secondary space-y-2">
          <p>Grant platform super admin via the bootstrap endpoint (requires <code className="text-text-primary">CRON_SECRET</code>):</p>
          <pre className="mt-2 overflow-x-auto rounded bg-elevated p-3 text-xs text-text-primary whitespace-pre-wrap">{`curl -X POST ${apiBase()}/api/v1/platform/super-admins/bootstrap \\
  -H "Authorization: Bearer <CRON_SECRET>" \\
  -H "Content-Type: application/json" \\
  -d '{"userId":"<supabase-user-uuid>","notes":"Platform founder"}'`}</pre>
          <p className="text-text-muted text-xs">Find the Supabase user UUID at: Supabase Dashboard → Authentication → Users.</p>
          <p className="text-text-muted text-xs">Once granted, set <code className="text-text-primary">NEXT_PUBLIC_STATIC_TOKEN</code> to a valid Supabase JWT for that user to enable authenticated platform routes.</p>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap gap-3 text-sm">
          <a href="/cs" className="rounded border border-border bg-surface px-4 py-2 text-text-secondary hover:text-text-primary transition-colors">CS Workspace →</a>
          <a href="/dashboard" className="rounded border border-border bg-surface px-4 py-2 text-text-secondary hover:text-text-primary transition-colors">App Dashboard →</a>
        </div>
      </section>

      {!health && (
        <div className="rounded border border-red-800 bg-red-950/30 p-4 text-red-400">
          <p className="font-medium">API Unreachable</p>
          <p className="mt-1 text-sm">Cannot connect to {apiBase()}/health. Verify API is running and NEXT_PUBLIC_API_BASE_URL is set correctly.</p>
        </div>
      )}
    </main>
  );
}
