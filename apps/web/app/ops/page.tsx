/**
 * Authenticated Platform Super Administrator dashboard.
 *
 * The API origin is server-only and is never rendered into the response.
 * Authorization is verified by the API using the user's Supabase access token
 * and database-backed platform permissions.
 */

import { redirect } from "next/navigation";
import { requireBrowserIdentity } from "../../src/server/auth";

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

function apiOrigin(): string | null {
  const configured =
    process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!configured) return null;
  try {
    const url = new URL(configured);
    const isCredentialEndpoint =
      url.hostname === "api.render.com" ||
      url.pathname.includes("/deploy/") ||
      url.search.length > 0;
    if (url.protocol !== "https:" || isCredentialEndpoint) return null;
    return url.origin;
  } catch {
    return null;
  }
}

async function getHealth(origin: string): Promise<HealthResponse | null> {
  try {
    const response = await fetch(`${origin}/health`, { cache: "no-store" });
    return response.ok ? ((await response.json()) as HealthResponse) : null;
  } catch {
    return null;
  }
}

async function authorizeDashboard(
  origin: string,
  accessToken: string,
): Promise<"authorized" | "denied" | "offline"> {
  try {
    const response = await fetch(`${origin}/api/v1/platform/dashboard`, {
      cache: "no-store",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (response.ok) return "authorized";
    if (response.status === 401 || response.status === 403) return "denied";
    return "offline";
  } catch {
    return "offline";
  }
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded border border-border bg-surface p-4">
      <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-text-muted">{sub}</p>}
    </div>
  );
}

export default async function OpsPage() {
  const { identity, accessToken } = await requireBrowserIdentity("/ops");
  const origin = apiOrigin();
  if (!origin) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-3xl">Platform Operations Unavailable</h1>
        <p className="mt-4 text-text-muted">
          The server-side API origin is missing or unsafe. No configured value
          has been exposed to the browser.
        </p>
      </main>
    );
  }

  const [authorization, health] = await Promise.all([
    authorizeDashboard(origin, accessToken),
    getHealth(origin),
  ]);
  if (authorization === "denied") {
    redirect("/dashboard?platformAccess=denied");
  }

  const uptime = health
    ? (() => {
        const seconds = Math.floor(health.checks.uptimeMs / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
      })()
    : "—";

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-muted">
            Platform Super Administrator · {identity.email}
          </p>
          <h1 className="mt-1 font-display text-3xl">BOSS Platform Status</h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              health?.status === "ok"
                ? "bg-green-500"
                : health
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
          />
          <span className="text-sm font-medium">
            {health?.status === "ok"
              ? "Operational"
              : health
                ? "Degraded"
                : "Offline"}
          </span>
        </div>
      </div>

      <div className="flex gap-4 text-xs text-text-muted">
        <span>
          Version:{" "}
          <span className="text-text-secondary">{health?.version ?? "—"}</span>
        </span>
        <span>
          Uptime: <span className="text-text-secondary">{uptime}</span>
        </span>
        <span>
          Authorization:{" "}
          <span className="text-text-secondary">{authorization}</span>
        </span>
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg text-text-secondary">
          API Health
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Error Rate" value={health?.checks.errorRate ?? "—"} />
          <Stat
            label="P50 Latency"
            value={health ? `${health.latency.httpRequestsP50Ms}ms` : "—"}
          />
          <Stat
            label="P95 Latency"
            value={health ? `${health.latency.httpRequestsP95Ms}ms` : "—"}
          />
          <Stat
            label="Heap Used"
            value={health ? `${health.memoryMb.heapUsed}MB` : "—"}
            sub={`of ${health?.memoryMb.heapTotal ?? "?"}MB total`}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg text-text-secondary">
          Platform Counters
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="HTTP Requests"
            value={health?.counters.httpRequests ?? "—"}
          />
          <Stat
            label="HTTP Errors"
            value={health?.counters.httpErrors ?? "—"}
          />
          <Stat
            label="Workflows Executed"
            value={health?.counters.workflowsExecuted ?? "—"}
          />
          <Stat
            label="Tool Executions"
            value={health?.counters.toolExecutions ?? "—"}
          />
          <Stat
            label="Scheduler Jobs"
            value={health?.counters.schedulerJobsExecuted ?? "—"}
          />
          <Stat
            label="Circuit Breakers"
            value={health?.counters.circuitBreakersOpened ?? "—"}
          />
          <Stat
            label="Provider Evidence"
            value={health?.counters.providerEvidenceRecorded ?? "—"}
          />
        </div>
      </section>

      {!health && (
        <div className="rounded border border-red-800 bg-red-950/30 p-4 text-red-400">
          <p className="font-medium">API Unreachable</p>
          <p className="mt-1 text-sm">
            The server could not reach the configured API origin. Its value is
            intentionally hidden.
          </p>
        </div>
      )}
    </main>
  );
}
