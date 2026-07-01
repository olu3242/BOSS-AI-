import { apiClient, ApiClientError } from "../../../../../lib/apiClient";
import { DEMO_ORG_ID } from "../../../../../lib/demoOrg";

interface Props {
  params: { businessId: string };
}

export default async function IntelligencePage({ params }: Props) {
  let snapshot;
  try {
    snapshot = await apiClient.getWorkspace(DEMO_ORG_ID, params.businessId);
  } catch (error) {
    const message = error instanceof ApiClientError ? error.body.message : "Failed to load intelligence data.";
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-3xl">Intelligence Center</h1>
        <div className="rounded border border-red-800 bg-red-950/30 p-4 text-red-400">
          <p className="font-medium">Failed to load intelligence data</p>
          <p className="mt-1 text-sm">{message}</p>
        </div>
      </div>
    );
  }

  const { decisions, kpis, loopStatus } = snapshot;
  const allDecisions = [...decisions.pending, ...decisions.approved, ...decisions.recentlyCompleted];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl">Intelligence Center</h1>

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

      {/* Active Intelligence Signals */}
      <section>
        <h2 className="mb-3 font-display text-lg text-neutral-300">Active Signals</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded border border-red-900/50 bg-red-950/20 p-4">
            <p className="text-xs text-red-400 uppercase tracking-wide">Constraints</p>
            <p className="mt-1 text-3xl font-bold text-red-300">{loopStatus.activeConstraints}</p>
            <p className="mt-1 text-xs text-neutral-400">Blocking business performance</p>
          </div>
          <div className="rounded border border-yellow-900/50 bg-yellow-950/20 p-4">
            <p className="text-xs text-yellow-400 uppercase tracking-wide">Recommendations</p>
            <p className="mt-1 text-3xl font-bold text-yellow-300">{loopStatus.activeRecommendations}</p>
            <p className="mt-1 text-xs text-neutral-400">Actions available to take</p>
          </div>
          <div className="rounded border border-blue-900/50 bg-blue-950/20 p-4">
            <p className="text-xs text-blue-400 uppercase tracking-wide">Decisions</p>
            <p className="mt-1 text-3xl font-bold text-blue-300">{allDecisions.length}</p>
            <p className="mt-1 text-xs text-neutral-400">In the decision pipeline</p>
          </div>
        </div>
      </section>

      {/* Decision Pipeline */}
      {allDecisions.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg text-neutral-300">Decision Pipeline</h2>
          <div className="flex flex-col gap-2">
            {allDecisions.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded border border-neutral-800 bg-neutral-900 px-4 py-3">
                <span className="text-sm">{d.title}</span>
                <div className="flex items-center gap-3">
                  {"confidenceScore" in d && (
                    <span className="text-xs text-neutral-400">
                      {Math.round((d as typeof decisions.pending[0]).confidenceScore * 100)}%
                    </span>
                  )}
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
