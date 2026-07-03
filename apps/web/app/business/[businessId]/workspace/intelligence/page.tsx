import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function IntelligencePage({ params }: Props) {
  const { businessId } = await params;
  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;
  let kpis;
  let rootCause;
  let decisions;

  try {
    [kpis, rootCause, decisions] = await Promise.all([
      apiClient.getKpis(orgId, businessId),
      apiClient.getRootCause(orgId, businessId).catch(() => null),
      apiClient.getDecisions(orgId, businessId),
    ]);
  } catch (error) {
    const message = error instanceof ApiClientError ? error.body.message : "Failed to load intelligence data.";
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-3xl">Intelligence</h1>
        <div className="rounded border border-red-800 bg-red-950/30 p-4 text-red-400">
          <p className="font-medium">Failed to load intelligence data</p>
          <p className="mt-1 text-sm">{message}</p>
        </div>
      </div>
    );
  }

  const chains = rootCause?.chains ?? [];
  const activeConstraintCount = chains.filter((c) => c.severity === "high" || c.severity === "critical").length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Business Domain</p>
        <h1 className="mt-1 font-display text-3xl">Intelligence</h1>
        <p className="mt-2 text-sm text-neutral-400">AI signals, KPIs, root causes, and the decision pipeline.</p>
      </div>

      {/* KPI Readings */}
      <section>
        <h2 className="mb-3 font-display text-lg text-neutral-300">KPI Readings</h2>
        {kpis.readings.length === 0 ? (
          <div className="rounded border border-neutral-800 bg-neutral-900 p-6 text-neutral-400">
            <p>No KPI data yet. Run a health assessment to generate KPI readings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {kpis.readings.map((kpi) => (
              <div key={kpi.kpiKey} className="rounded border border-neutral-800 bg-neutral-900 p-4">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{kpi.kpiKey}</p>
                <p className="mt-1 text-sm text-neutral-300">{kpi.label}</p>
                <p className="mt-2 text-2xl font-bold">
                  {kpi.value !== null ? kpi.value : <span className="text-neutral-600">N/A</span>}
                  {kpi.value !== null && kpi.unit !== "count" && (
                    <span className="ml-1 text-sm font-normal text-neutral-400">{kpi.unit}</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Root Cause Analysis */}
      <section>
        <h2 className="mb-3 font-display text-lg text-neutral-300">Active Intelligence Signals</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded border border-red-900/50 bg-red-950/20 p-4">
            <p className="text-xs text-red-400 uppercase tracking-wide">High-Severity Causes</p>
            <p className="mt-1 text-3xl font-bold text-red-300">{activeConstraintCount}</p>
            <p className="mt-1 text-xs text-neutral-400">Root causes blocking business performance</p>
          </div>
          <div className="rounded border border-blue-900/50 bg-blue-950/20 p-4">
            <p className="text-xs text-blue-400 uppercase tracking-wide">Decisions in Pipeline</p>
            <p className="mt-1 text-3xl font-bold text-blue-300">{decisions.length}</p>
            <p className="mt-1 text-xs text-neutral-400">Generated, pending review, or executing</p>
          </div>
        </div>
        {chains.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {chains.map((chain, i) => (
              <div key={i} className="rounded border border-neutral-800 bg-neutral-900 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{chain.rootCauseLabel}</span>
                  <span className={`rounded px-2 py-0.5 text-xs ${
                    chain.severity === "critical" ? "bg-red-900/50 text-red-400"
                    : chain.severity === "high" ? "bg-orange-900/50 text-orange-400"
                    : "bg-yellow-900/50 text-yellow-400"
                  }`}>
                    {chain.severity}
                  </span>
                </div>
                {chain.affectedKpiKeys.length > 0 && (
                  <p className="mt-1 text-xs text-neutral-500">Affects: {chain.affectedKpiKeys.join(", ")}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Decision Pipeline */}
      {decisions.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg text-neutral-300">Decision Pipeline</h2>
          <div className="flex flex-col gap-2">
            {decisions.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded border border-neutral-800 bg-neutral-900 px-4 py-3">
                <span className="text-sm">{d.objective}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400">
                    {Math.round(d.confidenceScore * 100)}%
                  </span>
                  <span className={`rounded px-2 py-0.5 text-xs ${
                    d.status === "approved" || d.status === "completed"
                      ? "bg-green-900/50 text-green-400"
                      : d.status === "generated" || d.status === "reviewed"
                        ? "bg-yellow-900/50 text-yellow-400"
                        : "bg-neutral-800 text-neutral-400"
                  }`}>
                    {d.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
