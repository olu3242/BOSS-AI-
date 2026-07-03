"use client";

import Link from "next/link";

interface HealthDistribution {
  excellent: number;
  good: number;
  needsAttention: number;
  critical: number;
}

interface TopAlert {
  businessId: string;
  businessName: string;
  healthScore: number;
}

interface RecentDecision {
  id: string;
  businessId: string;
  businessName: string;
  objective: string;
  status: string;
  createdAt: string;
}

interface DashboardData {
  businessCount: number;
  healthDistribution: HealthDistribution;
  topAlerts: TopAlert[];
  recentDecisions: RecentDecision[];
  pendingApprovalsCount: number;
  revenueAtRisk: number;
}

interface Props {
  orgId: string;
  data: DashboardData | null;
  error: string | null;
}

function healthScoreColor(score: number) {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
}

function healthScoreBg(score: number) {
  if (score >= 80) return "border-green-900/50 bg-green-950/20";
  if (score >= 60) return "border-yellow-900/50 bg-yellow-950/20";
  return "border-red-900/50 bg-red-950/20";
}

function statusColor(status: string) {
  if (status === "approved") return "text-green-400";
  if (status === "rejected") return "text-red-400";
  if (status === "pending") return "text-yellow-400";
  return "text-neutral-400";
}

export default function DashboardClient({ orgId: _orgId, data, error }: Props) {
  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Executive Dashboard</p>
            <h1 className="mt-1 font-display text-3xl">Dashboard</h1>
          </div>
        </div>
        <div className="rounded border border-red-800 bg-red-950/30 p-5 text-red-400">
          <p className="font-medium">Dashboard unavailable</p>
          <p className="mt-1 text-sm">{error}</p>
          <Link
            href="/businesses"
            className="mt-4 inline-flex rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
          >
            View Businesses →
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-8 animate-pulse">
        <div className="h-10 w-48 rounded bg-neutral-800" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded border border-neutral-800 bg-neutral-900" />
          ))}
        </div>
        <div className="h-40 rounded border border-neutral-800 bg-neutral-900" />
        <div className="h-40 rounded border border-neutral-800 bg-neutral-900" />
      </div>
    );
  }

  const { businessCount, healthDistribution, topAlerts, recentDecisions, pendingApprovalsCount, revenueAtRisk } = data;
  const totalWithScores = healthDistribution.excellent + healthDistribution.good + healthDistribution.needsAttention + healthDistribution.critical;

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Executive Overview</p>
          <h1 className="mt-1 font-display text-3xl">Dashboard</h1>
          <p className="mt-2 text-sm text-neutral-400">
            {businessCount === 0
              ? "No businesses yet. Add your first business to get started."
              : `Monitoring ${businessCount} business${businessCount === 1 ? "" : "es"} across your organization.`}
          </p>
        </div>
        <Link
          href="/businesses/new"
          className="shrink-0 rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
        >
          + Add Business
        </Link>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Total Businesses"
          value={businessCount}
          linkHref="/businesses"
          linkLabel="View all →"
        />
        <StatTile
          label="Pending Approvals"
          value={pendingApprovalsCount}
          accent={pendingApprovalsCount > 0 ? "text-yellow-400" : undefined}
          linkHref="/businesses"
          linkLabel="Review →"
        />
        <StatTile
          label="Critical Alerts"
          value={healthDistribution.critical}
          accent={healthDistribution.critical > 0 ? "text-red-400" : undefined}
          linkHref="/businesses"
          linkLabel="View →"
        />
        <StatTile
          label="Revenue at Risk"
          value={`$${revenueAtRisk.toLocaleString()}`}
          accent={revenueAtRisk > 0 ? "text-red-400" : undefined}
        />
      </div>

      {/* Health Distribution */}
      {totalWithScores > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">Health Distribution</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <HealthBucket label="Excellent" count={healthDistribution.excellent} color="text-green-400" barColor="bg-green-500" total={totalWithScores} />
            <HealthBucket label="Good" count={healthDistribution.good} color="text-blue-400" barColor="bg-blue-500" total={totalWithScores} />
            <HealthBucket label="Needs Attention" count={healthDistribution.needsAttention} color="text-yellow-400" barColor="bg-yellow-500" total={totalWithScores} />
            <HealthBucket label="Critical" count={healthDistribution.critical} color="text-red-400" barColor="bg-red-500" total={totalWithScores} />
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Top Alerts */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base text-neutral-300">Top Alerts</h2>
            <Link href="/businesses" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
              All businesses →
            </Link>
          </div>
          {topAlerts.length === 0 ? (
            <div className="rounded border border-neutral-800 bg-neutral-900 p-5">
              <p className="text-sm font-medium text-neutral-300">No critical alerts</p>
              <p className="mt-1 text-xs text-neutral-500">All businesses are healthy.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {topAlerts.map((alert) => (
                <Link
                  key={alert.businessId}
                  href={`/business/${alert.businessId}/health`}
                  className={`flex items-center gap-4 rounded border px-4 py-3 transition-colors hover:bg-neutral-800/60 ${healthScoreBg(alert.healthScore)}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-200 truncate">{alert.businessName}</p>
                    <p className="text-xs text-neutral-500">Needs immediate attention</p>
                  </div>
                  <span className={`shrink-0 font-display text-xl font-black ${healthScoreColor(alert.healthScore)}`}>
                    {alert.healthScore}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent Decisions */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base text-neutral-300">Recent Decisions</h2>
          </div>
          {recentDecisions.length === 0 ? (
            <div className="rounded border border-neutral-800 bg-neutral-900 p-5">
              <p className="text-sm font-medium text-neutral-300">No decisions yet</p>
              <p className="mt-1 text-xs text-neutral-500">Decisions will appear here as BOSS analyzes your businesses.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentDecisions.slice(0, 5).map((decision) => (
                <div key={decision.id} className="flex items-start gap-3 rounded border border-neutral-800 bg-neutral-900 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug text-neutral-300 truncate">{decision.objective}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {decision.businessName} ·{" "}
                      {new Date(decision.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium capitalize ${statusColor(decision.status)}`}>
                    {decision.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Empty state for new orgs */}
      {businessCount === 0 && (
        <div className="rounded border border-neutral-700 bg-neutral-900 p-8 text-center">
          <p className="text-lg font-medium text-neutral-200">Welcome to BOSS</p>
          <p className="mt-2 text-sm text-neutral-400 max-w-md mx-auto">
            Add your first business to unlock AI-powered insights, health tracking, and automated recommendations.
          </p>
          <Link
            href="/business/new"
            className="mt-5 inline-flex rounded bg-red-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors"
          >
            Add Your First Business →
          </Link>
        </div>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
  linkHref,
  linkLabel,
}: {
  label: string;
  value: number | string;
  accent?: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
      <p className="text-xs text-neutral-500 leading-tight">{label}</p>
      <p className={`mt-2 font-display text-3xl font-black leading-none ${accent ?? "text-white"}`}>{value}</p>
      {linkHref && linkLabel && (
        <Link href={linkHref} className="mt-3 block text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function HealthBucket({
  label,
  count,
  color,
  barColor,
  total,
}: {
  label: string;
  count: number;
  color: string;
  barColor: string;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${color}`}>{count}</p>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-neutral-800">
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-neutral-600">{pct}%</p>
    </div>
  );
}
