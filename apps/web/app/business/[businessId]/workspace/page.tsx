import Link from "next/link";
import { apiClient, ApiClientError } from "../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../src/server/auth";
import { StatTile } from "../../../../src/components/ui/StatTile";
import { EmptyState } from "../../../../src/components/ui/EmptyState";
import { PageHeader } from "../../../../src/components/ui/PageHeader";
import { Card } from "../../../../src/components/ui/Card";
import { Badge } from "../../../../src/components/ui/Badge";

interface Props {
  params: Promise<{ businessId: string }>;
}

const LOOP_STAGES = [
  { key: "observe",     label: "Observe" },
  { key: "understand",  label: "Understand" },
  { key: "prioritize",  label: "Prioritize" },
  { key: "recommend",   label: "Recommend" },
  { key: "approve",     label: "Approve" },
  { key: "execute",     label: "Execute" },
  { key: "measure",     label: "Measure" },
  { key: "learn",       label: "Learn" },
  { key: "improve",     label: "Improve" },
] as const;

const DOMAIN_TILES = [
  { key: "customers",     label: "Customers",    icon: "👥", desc: "Relationships & history" },
  { key: "work",          label: "Work",          icon: "🔧", desc: "Jobs & appointments" },
  { key: "money",         label: "Money",         icon: "💰", desc: "Revenue & cash flow" },
  { key: "operations",    label: "Operations",    icon: "⚙️",  desc: "Team & workflows" },
  { key: "intelligence",  label: "Intelligence",  icon: "🧠", desc: "Insights & automation" },
] as const;

function healthTone(score: number) {
  if (score >= 70) return { label: "Healthy",          color: "text-green-400",  bar: "bg-green-500",  bg: "bg-green-950/30 border-green-900/50" };
  if (score >= 40) return { label: "Needs Attention",  color: "text-yellow-400", bar: "bg-yellow-500", bg: "bg-yellow-950/30 border-yellow-900/50" };
  return               { label: "At Risk",             color: "text-red-400",    bar: "bg-red-500",    bg: "bg-red-950/30 border-red-900/50" };
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


function dailyFocus(pendingRecs: number, pendingApprovals: number): string {
  if (pendingApprovals > 0) return `You have ${pendingApprovals} decision${pendingApprovals > 1 ? "s" : ""} awaiting approval.`;
  if (pendingRecs > 0) return `${pendingRecs} AI recommendation${pendingRecs > 1 ? "s" : ""} ready for review.`;
  return "Your business is running smoothly. Review your metrics below.";
}

export default async function CommandCenterPage({ params }: Props) {
  const { businessId } = await params;
  const base = `/business/${businessId}/workspace`;

  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;

  const [snapshotResult, recommendationsResult, timelineResult, customersResult] = await Promise.allSettled([
    apiClient.getWorkspace(orgId, businessId),
    apiClient.listRecommendations(orgId, businessId),
    apiClient.getTimeline(orgId, businessId),
    apiClient.listCustomers(orgId, businessId),
  ]);

  if (snapshotResult.status === "rejected") {
    const error = snapshotResult.reason;
    const message = error instanceof ApiClientError ? error.body.message : "Failed to load dashboard.";
    return (
      <div className="flex flex-col gap-6">
        <DailyBriefHeader date={new Date()} stage="observe" focus="Complete Business MRI to activate your operating system." />
        <div className="rounded border border-red-800 bg-red-950/30 p-5 text-red-400">
          <p className="font-medium">Dashboard unavailable</p>
          <p className="mt-1 text-sm">{message}</p>
          <Link href={`/business/${businessId}/mri`} className="mt-4 inline-flex rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">
            Start Business MRI
          </Link>
        </div>
        <DomainTiles base={base} customerCount={0} />
      </div>
    );
  }

  const snapshot = snapshotResult.value;
  const recommendations = recommendationsResult.status === "fulfilled" ? recommendationsResult.value : [];
  const timeline = timelineResult.status === "fulfilled" ? timelineResult.value : [];
  const customers = customersResult.status === "fulfilled" ? customersResult.value : [];

  const { health, kpis, decisions, approvalQueue, loopStatus } = snapshot;

  const proposedRecs = recommendations.filter((r) => r.status === "proposed").slice(0, 3);
  const recentActivity = timeline.slice(0, 5);
  const tone = health ? healthTone(health.overallScore) : null;

  const currentStage: string =
    approvalQueue.totalPending > 0 ? "approve" :
    proposedRecs.length > 0       ? "recommend" :
    loopStatus.activeConstraints > 0 ? "understand" :
    loopStatus.lastRunAt          ? "measure" :
    "observe";
  const focusMessage = dailyFocus(proposedRecs.length, approvalQueue.totalPending);

  return (
    <div className="flex flex-col gap-8">

      {/* ── DAILY BRIEF ─────────────────────────────────────── */}
      <DailyBriefHeader date={new Date(snapshot.assembledAt)} stage={currentStage} focus={focusMessage} />

      {/* ── OPERATING LOOP ──────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-widest text-text-muted">Business Operating Loop</h2>
          {loopStatus.lastRunAt && (
            <span className="text-xs text-text-muted">
              Last run {new Date(loopStatus.lastRunAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {LOOP_STAGES.map((stage, i) => {
            const stageKeys = LOOP_STAGES.map(s => s.key);
            const currentIdx = stageKeys.indexOf(currentStage as typeof stageKeys[number]);
            const isActive  = stage.key === currentStage;
            const isPast    = i < currentIdx;
            return (
              <div
                key={stage.key}
                className={`flex min-w-[80px] flex-1 flex-col items-center gap-1 rounded border py-2 px-1 text-center transition-colors ${
                  isActive  ? "border-red-800 bg-red-950/40" :
                  isPast    ? "border-border bg-elevated/60" :
                              "border-border bg-surface/20"
                }`}
              >
                <span className={`text-[10px] font-medium leading-tight ${
                  isActive ? "text-red-300" : isPast ? "text-text-secondary" : "text-text-muted"
                }`}>
                  {stage.label}
                </span>
                <span className={`h-1 w-1 rounded-full ${
                  isActive ? "bg-red-500" : isPast ? "bg-border" : "bg-elevated"
                }`} />
              </div>
            );
          })}
        </div>
      </section>

      {/* ── DOMAIN TILES ────────────────────────────────────── */}
      <DomainTiles base={base} customerCount={customers.length} />

      {/* ── HEALTH + PRIORITY ACTIONS ───────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Health Score */}
        {health ? (
          <section className={`rounded border p-6 ${tone?.bg ?? "border-border bg-surface"}`}>
            <p className="text-xs font-medium uppercase tracking-widest text-text-muted">Business Health</p>
            <div className="mt-2 flex items-baseline gap-3">
              <span className={`font-display text-5xl font-black ${tone?.color ?? "text-text-primary"}`}>{health.overallScore}</span>
              <span className="text-lg text-text-muted">/ 100</span>
              <span className={`text-sm font-medium ${tone?.color}`}>{tone?.label}</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
              <div className={`h-full rounded-full ${tone?.bar} transition-all`} style={{ width: `${health.overallScore}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <StatBubble value={loopStatus.activeConstraints} label="Constraints" color={loopStatus.activeConstraints > 0 ? "text-red-400" : "text-text-muted"} />
              <StatBubble value={proposedRecs.length} label="Recommendations" color={proposedRecs.length > 0 ? "text-yellow-400" : "text-text-muted"} />
              <StatBubble value={approvalQueue.totalPending} label="Approvals" color={approvalQueue.totalPending > 0 ? "text-blue-400" : "text-text-muted"} />
            </div>
          </section>
        ) : (
          <section>
            <EmptyState
              title="No health score yet"
              description="Complete the Business MRI to generate your health score."
              dashed={false}
              action={
                <Link href={`/business/${businessId}/mri`} className="rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors">
                  Start Business MRI →
                </Link>
              }
            />
          </section>
        )}

        {/* Priority Actions */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base text-text-primary">Priority Actions</h2>
            <Link href={`${base}/approvals`} className="text-xs text-text-muted hover:text-text-secondary transition-colors">
              {approvalQueue.totalPending > 0 && (
                <span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {approvalQueue.totalPending}
                </span>
              )}
              Approvals →
            </Link>
          </div>
          {decisions.pending.length === 0 && proposedRecs.length === 0 ? (
            <EmptyState
              title="No actions required"
              description="Your operating loop is clean."
              dashed={false}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {decisions.pending.slice(0, 3).map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded border border-yellow-900/40 bg-yellow-950/20 px-4 py-3">
                  <span className="text-yellow-400 text-xs font-bold uppercase">Decision</span>
                  <span className="flex-1 min-w-0 truncate text-sm">{d.objective}</span>
                  <span className="shrink-0 text-xs text-text-muted">{Math.round(d.confidenceScore * 100)}%</span>
                </div>
              ))}
              {proposedRecs.slice(0, 3 - Math.min(decisions.pending.length, 3)).map((r) => (
                <Card key={r.id} padding="sm" className="flex items-center gap-3">
                  <span className="text-blue-400 text-xs font-bold uppercase">Rec</span>
                  <span className="flex-1 min-w-0 truncate text-sm">{r.title}</span>
                  <span className="shrink-0 text-xs text-green-400">${r.estimatedRoi.profitImpactAnnual.toLocaleString()}/yr</span>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── AI RECOMMENDATIONS ───────────────────────────────── */}
      {proposedRecs.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-text-primary">AI Recommendations</h2>
            <Link href={`${base}/recommendations`} className="text-xs text-text-muted hover:text-text-secondary transition-colors">
              View all ({recommendations.length}) →
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {proposedRecs.map((rec) => (
              <Card key={rec.id}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{rec.title}</span>
                      <Badge color="neutral">{rec.category.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-text-muted line-clamp-2">{rec.description}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-text-muted">
                      <span>ROI: <strong className="text-green-400">${rec.estimatedRoi.profitImpactAnnual.toLocaleString()}/yr</strong></span>
                      <span>Effort: {rec.estimatedEffortHours}h</span>
                      <span>Confidence: {Math.round(rec.confidence * 100)}%</span>
                    </div>
                  </div>
                  <RecommendationInlineActions recommendationId={rec.id} businessId={businessId} />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── KEY METRICS ──────────────────────────────────────── */}
      {kpis.readings.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-lg text-text-primary">Key Metrics</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {kpis.readings.map((kpi) => {
              const rawTrend = "trend" in kpi ? (kpi as { trend: string | null }).trend : null;
              const trend = rawTrend === "up" ? "up" : rawTrend === "down" ? "down" : "neutral";
              return (
                <StatTile
                  key={kpi.kpiKey}
                  label={kpi.label}
                  value={formatKpiValue(kpi.value, kpi.unit)}
                  trend={trend}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* ── RECENT ACTIVITY ──────────────────────────────────── */}
      {recentActivity.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-text-primary">Recent Activity</h2>
            <Link href={`${base}/timeline`} className="text-xs text-text-muted hover:text-text-secondary transition-colors">
              Full timeline →
            </Link>
          </div>
          <div className="flex flex-col gap-1.5">
            {recentActivity.map((entry) => (
              <Card key={entry.id} padding="sm" className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-border" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug text-text-secondary truncate">{entry.description}</p>
                  <time className="text-xs text-text-muted">
                    {new Date(entry.occurredAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </time>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function DailyBriefHeader({ date, stage, focus }: { date: Date; stage: string; focus: string }) {
  const dayName = date.toLocaleDateString([], { weekday: "long" });
  const dateStr = date.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
  return (
    <PageHeader
      title="Command Center"
      description={focus}
      back={<span className="text-xs text-text-muted">{dayName} · {dateStr}</span>}
      action={
        <div className="shrink-0 rounded border border-border bg-surface px-3 py-1.5 text-xs text-text-muted capitalize hidden sm:block">
          Loop: <span className="text-text-primary font-medium">{stage}</span>
        </div>
      }
    />
  );
}

function DomainTiles({ base, customerCount }: { base: string; customerCount: number }) {
  const counts: Record<string, number | null> = {
    customers: customerCount,
    work: null, money: null, operations: null, intelligence: null,
  };
  return (
    <section>
      <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-text-muted">Business Domains</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {DOMAIN_TILES.map((d) => (
          <Link
            key={d.key}
            href={`${base}/${d.key}`}
            className="flex flex-col gap-2 rounded border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-elevated/60"
          >
            <span className="text-2xl">{d.icon}</span>
            <div>
              <p className="text-sm font-medium text-text-primary">{d.label}</p>
              <p className="text-xs text-text-muted">
                {counts[d.key] !== null ? `${counts[d.key]} records` : d.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function StatBubble({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-text-muted mt-0.5">{label}</p>
    </div>
  );
}

function RecommendationInlineActions({ recommendationId, businessId }: { recommendationId: string; businessId: string }) {
  return (
    <div className="flex shrink-0 flex-col gap-2">
      <form action={`/api/recommendations/${recommendationId}/approve`} method="POST">
        <input type="hidden" name="businessId" value={businessId} />
        <button type="submit" className="rounded bg-green-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors w-full">
          Approve
        </button>
      </form>
      <form action={`/api/recommendations/${recommendationId}/dismiss`} method="POST">
        <input type="hidden" name="businessId" value={businessId} />
        <button type="submit" className="rounded bg-elevated px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-border transition-colors w-full">
          Dismiss
        </button>
      </form>
    </div>
  );
}
