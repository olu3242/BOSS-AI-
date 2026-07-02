import Link from "next/link";
import { apiClient, ApiClientError } from "../../../../src/lib/apiClient";
import { DEMO_ORG_ID } from "../../../../src/lib/demoOrg";

interface Props {
  params: Promise<{ businessId: string }>;
}

function healthTone(score: number) {
  if (score >= 70) return { label: "Healthy", color: "text-green-400", bar: "bg-green-500", bg: "bg-green-950/30 border-green-900/50" };
  if (score >= 40) return { label: "Needs Attention", color: "text-yellow-400", bar: "bg-yellow-500", bg: "bg-yellow-950/30 border-yellow-900/50" };
  return { label: "At Risk", color: "text-red-400", bar: "bg-red-500", bg: "bg-red-950/30 border-red-900/50" };
}

function TrendBadge({ trend }: { trend: string | null }) {
  if (trend === "up") return <span className="text-green-400 text-xs">↑ Up</span>;
  if (trend === "down") return <span className="text-red-400 text-xs">↓ Down</span>;
  return <span className="text-neutral-500 text-xs">→ Stable</span>;
}

function formatKpiValue(value: number | null, unit: string): string {
  if (value === null) return "—";
  if (unit === "%") return `${value.toFixed(1)}%`;
  if (unit === "$") return `$${value.toLocaleString()}`;
  if (unit === "min") return `${value}m`;
  if (unit === "hrs/wk") return `${value}h`;
  if (unit === "stars") return `${value.toFixed(1)}★`;
  return String(value);
}

function categoryColor(category: string) {
  const map: Record<string, string> = {
    revenue_growth: "text-green-400 bg-green-950/40 border-green-900/50",
    cost_reduction: "text-blue-400 bg-blue-950/40 border-blue-900/50",
    customer_retention: "text-purple-400 bg-purple-950/40 border-purple-900/50",
    operational_efficiency: "text-yellow-400 bg-yellow-950/40 border-yellow-900/50",
    lead_generation: "text-orange-400 bg-orange-950/40 border-orange-900/50",
    reputation: "text-pink-400 bg-pink-950/40 border-pink-900/50",
  };
  return map[category] ?? "text-neutral-400 bg-neutral-800 border-neutral-700";
}

export default async function CommandCenterPage({ params }: Props) {
  const { businessId } = await params;
  const base = `/business/${businessId}/workspace`;

  const [snapshotResult, recommendationsResult, timelineResult] = await Promise.allSettled([
    apiClient.getWorkspace(DEMO_ORG_ID, businessId),
    apiClient.listRecommendations(DEMO_ORG_ID, businessId),
    apiClient.getTimeline(DEMO_ORG_ID, businessId),
  ]);

  if (snapshotResult.status === "rejected") {
    const error = snapshotResult.reason;
    const message = error instanceof ApiClientError ? error.body.message : "Failed to load dashboard.";
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-3xl">Command Center</h1>
        <div className="rounded border border-red-800 bg-red-950/30 p-5 text-red-400">
          <p className="font-medium">Dashboard unavailable</p>
          <p className="mt-1 text-sm">{message}</p>
          <p className="mt-2 text-sm text-neutral-400">Complete the Business MRI first to generate live data.</p>
          <Link
            href={`/business/${businessId}/mri`}
            className="mt-4 inline-flex rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Start Business MRI
          </Link>
        </div>
      </div>
    );
  }

  const snapshot = snapshotResult.value;
  const recommendations = recommendationsResult.status === "fulfilled" ? recommendationsResult.value : [];
  const timeline = timelineResult.status === "fulfilled" ? timelineResult.value : [];

  const { health, kpis, decisions, approvalQueue, loopStatus } = snapshot;

  const proposedRecs = recommendations
    .filter((r) => r.status === "proposed")
    .slice(0, 3);

  const recentActivity = timeline.slice(0, 6);

  const tone = health ? healthTone(health.overallScore) : null;

  return (
    <div className="flex flex-col gap-8">

      {/* ── PAGE HEADER ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Command Center</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Updated {new Date(snapshot.assembledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <Link
          href={`${base}/approvals`}
          className="flex items-center gap-2 rounded border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm hover:border-neutral-600 transition-colors"
        >
          {approvalQueue.totalPending > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white">
              {approvalQueue.totalPending}
            </span>
          )}
          Approval Center
        </Link>
      </div>

      {/* ── HEALTH BANNER ────────────────────────────────────── */}
      {health ? (
        <section
          className={`rounded border p-6 ${tone?.bg ?? "border-neutral-800 bg-neutral-900"}`}
          aria-label="Business Health Score"
        >
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Business Health Score</p>
              <div className="mt-2 flex items-baseline gap-3">
                <span className={`font-display text-6xl font-black ${tone?.color ?? "text-white"}`}>
                  {health.overallScore}
                </span>
                <span className="text-xl text-neutral-500">/ 100</span>
                <span className={`text-sm font-medium ${tone?.color ?? "text-neutral-400"}`}>{tone?.label}</span>
              </div>
              <div className="mt-3 h-2 w-48 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className={`h-full rounded-full ${tone?.bar ?? "bg-neutral-500"} transition-all`}
                  style={{ width: `${health.overallScore}%` }}
                />
              </div>
            </div>
            <div className="hidden sm:grid grid-cols-3 gap-4 text-center">
              <div>
                <p className={`text-2xl font-bold ${loopStatus.activeConstraints > 0 ? "text-red-400" : "text-neutral-400"}`}>
                  {loopStatus.activeConstraints}
                </p>
                <p className="text-xs text-neutral-500 mt-1">Constraints</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${recommendations.filter(r => r.status === "proposed").length > 0 ? "text-yellow-400" : "text-neutral-400"}`}>
                  {recommendations.filter((r) => r.status === "proposed").length}
                </p>
                <p className="text-xs text-neutral-500 mt-1">Recommendations</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${approvalQueue.totalPending > 0 ? "text-blue-400" : "text-neutral-400"}`}>
                  {approvalQueue.totalPending}
                </p>
                <p className="text-xs text-neutral-500 mt-1">Awaiting Approval</p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded border border-neutral-800 bg-neutral-900 p-6">
          <p className="font-medium text-neutral-300">No health score yet</p>
          <p className="mt-1 text-sm text-neutral-500">Complete the Business MRI to generate your health score.</p>
          <Link
            href={`/business/${businessId}/mri`}
            className="mt-4 inline-flex rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
          >
            Start Business MRI →
          </Link>
        </section>
      )}

      {/* ── AI RECOMMENDATIONS ───────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-neutral-300">AI Recommendations</h2>
          <Link
            href={`${base}/recommendations`}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            View all ({recommendations.length}) →
          </Link>
        </div>
        {proposedRecs.length === 0 ? (
          <div className="rounded border border-neutral-800 bg-neutral-900 p-5 text-neutral-400">
            <p className="font-medium">No pending recommendations</p>
            <p className="mt-1 text-sm">
              {recommendations.length === 0
                ? "Run a Business MRI to generate AI-powered recommendations."
                : "All recommendations have been actioned. Well done."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {proposedRecs.map((rec) => (
              <div key={rec.id} className="rounded border border-neutral-800 bg-neutral-900 p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{rec.title}</span>
                      <span className={`rounded border px-2 py-0.5 text-[11px] font-medium capitalize ${categoryColor(rec.category)}`}>
                        {rec.category.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-400 line-clamp-2">{rec.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
                      <span>ROI: <strong className="text-green-400">${rec.estimatedRoi.profitImpactAnnual.toLocaleString()}/yr</strong></span>
                      <span>Effort: {rec.estimatedEffortHours}h</span>
                      <span>Confidence: {Math.round(rec.confidence * 100)}%</span>
                    </div>
                  </div>
                  <RecommendationInlineActions recommendationId={rec.id} businessId={businessId} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── KEY METRICS ──────────────────────────────────────── */}
      {kpis.readings.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-lg text-neutral-300">Key Metrics</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {kpis.readings.map((kpi) => (
              <div key={kpi.kpiKey} className="rounded border border-neutral-800 bg-neutral-900 p-4">
                <p className="text-xs text-neutral-500 leading-tight">{kpi.label}</p>
                <p className="mt-2 text-2xl font-semibold leading-none">
                  {formatKpiValue(kpi.value, kpi.unit)}
                </p>
                <div className="mt-2">
                  <TrendBadge trend={"trend" in kpi ? (kpi as { trend: string | null }).trend : null} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── BOTTOM GRID: Decisions + Activity ────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Decision Pipeline */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-neutral-300">Decision Pipeline</h2>
            <Link
              href={`${base}/approvals`}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Approval Center →
            </Link>
          </div>
          {decisions.pending.length === 0 && decisions.approved.length === 0 ? (
            <div className="rounded border border-neutral-800 bg-neutral-900 p-5 text-sm text-neutral-400">
              No active decisions. Run the operating loop to generate new decisions.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {decisions.pending.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded border border-yellow-900/50 bg-yellow-950/20 px-4 py-3 gap-4">
                  <span className="text-sm flex-1 min-w-0 truncate">{d.objective}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-neutral-500">{Math.round(d.confidenceScore * 100)}%</span>
                    <span className="rounded bg-yellow-900/60 px-2 py-0.5 text-xs text-yellow-400 capitalize">{d.status}</span>
                  </div>
                </div>
              ))}
              {decisions.approved.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded border border-green-900/50 bg-green-950/20 px-4 py-3 gap-4">
                  <span className="text-sm flex-1 min-w-0 truncate">{d.objective}</span>
                  <span className="rounded bg-green-900/60 px-2 py-0.5 text-xs text-green-400 shrink-0">{d.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-neutral-300">Recent Activity</h2>
            <Link
              href={`${base}/timeline`}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Full timeline →
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <div className="rounded border border-neutral-800 bg-neutral-900 p-5 text-sm text-neutral-400">
              No activity yet.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {recentActivity.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 rounded border border-neutral-800 bg-neutral-900 px-3 py-2.5">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug text-neutral-300 truncate">{entry.description}</p>
                    <time className="text-xs text-neutral-600">
                      {new Date(entry.occurredAt).toLocaleString([], {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── LOOP STATUS ──────────────────────────────────────── */}
      {loopStatus.lastRunAt && (
        <section className="rounded border border-neutral-800 bg-neutral-900/50 px-5 py-3">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Operating Loop last ran {new Date(loopStatus.lastRunAt).toLocaleString([], {
              weekday: "short", month: "short", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </div>
        </section>
      )}

    </div>
  );
}

/* Inline approve/dismiss for the recommendations strip (server renders the buttons,
   actual actions are handled via form POST to avoid needing a client component here) */
function RecommendationInlineActions({ recommendationId, businessId }: { recommendationId: string; businessId: string }) {
  return (
    <div className="flex shrink-0 flex-col gap-2">
      <form action={`/api/recommendations/${recommendationId}/approve`} method="POST">
        <input type="hidden" name="businessId" value={businessId} />
        <button
          type="submit"
          className="rounded bg-green-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors w-full"
        >
          Approve
        </button>
      </form>
      <form action={`/api/recommendations/${recommendationId}/dismiss`} method="POST">
        <input type="hidden" name="businessId" value={businessId} />
        <button
          type="submit"
          className="rounded bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:bg-neutral-700 transition-colors w-full"
        >
          Dismiss
        </button>
      </form>
    </div>
  );
}
