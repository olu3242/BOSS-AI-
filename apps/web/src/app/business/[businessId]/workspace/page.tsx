import { apiClient, ApiClientError } from "../../../../lib/apiClient";
import { DEMO_ORG_ID } from "../../../../lib/demoOrg";

interface Props {
  params: { businessId: string };
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
    </div>
  );
}

export default async function WorkspacePage({ params }: Props) {
  let snapshot;
  try {
    snapshot = await apiClient.getWorkspace(DEMO_ORG_ID, params.businessId);
  } catch (error) {
    const message = error instanceof ApiClientError ? error.body.message : "Failed to load workspace.";
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-3xl">Executive Workspace</h1>
        <div className="rounded border border-red-800 bg-red-950/30 p-4 text-red-400">
          <p className="font-medium">Failed to load workspace</p>
          <p className="mt-1 text-sm">{message}</p>
          <p className="mt-2 text-sm">Run the Business MRI first to generate workspace data.</p>
        </div>
      </div>
    );
  }

  const { health, kpis, decisions, approvalQueue, loopStatus } = snapshot;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Executive Workspace</h1>
        <span className="text-sm text-neutral-500">Updated {new Date(snapshot.assembledAt).toLocaleTimeString()}</span>
      </div>

      {/* Health Summary */}
      <section>
        <h2 className="mb-3 font-display text-lg text-neutral-300">Business Health</h2>
        {health ? (
          <div className="rounded border border-neutral-800 bg-neutral-900 p-5">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-4xl font-bold">{health.overallScore}</span>
              <span className="text-sm text-neutral-500">/ 100</span>
            </div>
            <ScoreBar score={health.overallScore} />
            <p className="mt-2 text-xs text-neutral-500">
              Calculated {new Date(health.generatedAt).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <div className="rounded border border-neutral-800 bg-neutral-900 p-5 text-neutral-400">
            <p>No health score yet.</p>
            <p className="mt-1 text-sm">Complete the Business MRI to generate your health score.</p>
          </div>
        )}
      </section>

      {/* KPI Strip */}
      {kpis.readings.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg text-neutral-300">Key Metrics</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {kpis.readings.map((kpi) => (
              <div key={kpi.kpiKey} className="rounded border border-neutral-800 bg-neutral-900 p-4">
                <p className="text-xs text-neutral-500">{kpi.label}</p>
                <p className="mt-1 text-2xl font-semibold">
                  {kpi.value !== null ? kpi.value : "—"}
                  {kpi.value !== null && kpi.unit !== "count" && (
                    <span className="ml-1 text-sm text-neutral-400">{kpi.unit}</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Operating Loop Status */}
      <section>
        <h2 className="mb-3 font-display text-lg text-neutral-300">Operating Loop</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded border border-neutral-800 bg-neutral-900 p-4 text-center">
            <p className="text-3xl font-bold text-red-400">{loopStatus.activeConstraints}</p>
            <p className="mt-1 text-xs text-neutral-500">Active Constraints</p>
          </div>
          <div className="rounded border border-neutral-800 bg-neutral-900 p-4 text-center">
            <p className="text-3xl font-bold text-yellow-400">{loopStatus.activeRecommendations}</p>
            <p className="mt-1 text-xs text-neutral-500">Recommendations</p>
          </div>
          <div className="rounded border border-neutral-800 bg-neutral-900 p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">{approvalQueue.totalPending}</p>
            <p className="mt-1 text-xs text-neutral-500">Awaiting Approval</p>
          </div>
        </div>
        {loopStatus.lastRunAt && (
          <p className="mt-2 text-xs text-neutral-500">
            Last loop run: {new Date(loopStatus.lastRunAt).toLocaleString()}
          </p>
        )}
      </section>

      {/* Decisions Panel */}
      <section>
        <h2 className="mb-3 font-display text-lg text-neutral-300">Decision Pipeline</h2>
        {decisions.pending.length === 0 && decisions.approved.length === 0 ? (
          <div className="rounded border border-neutral-800 bg-neutral-900 p-5 text-neutral-400">
            <p>No active decisions.</p>
            <p className="mt-1 text-sm">Run the operating loop to generate decisions from your business data.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {decisions.pending.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded border border-yellow-900/50 bg-yellow-950/20 px-4 py-3">
                <span className="text-sm">{d.objective}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400">
                    {Math.round(d.confidenceScore * 100)}% confidence
                  </span>
                  <span className="rounded bg-yellow-900/50 px-2 py-0.5 text-xs text-yellow-400">
                    {d.status}
                  </span>
                </div>
              </div>
            ))}
            {decisions.approved.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded border border-green-900/50 bg-green-950/20 px-4 py-3">
                <span className="text-sm">{d.objective}</span>
                <span className="rounded bg-green-900/50 px-2 py-0.5 text-xs text-green-400">{d.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
