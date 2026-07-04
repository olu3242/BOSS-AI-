"use client";

import Link from "next/link";
import { StatTile } from "../../src/components/ui/StatTile";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { PageHeader } from "../../src/components/ui/PageHeader";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";
import { Badge } from "../../src/components/ui/Badge";

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

function decisionStatusColor(status: string): "green" | "red" | "yellow" | "neutral" {
  if (status === "approved") return "green";
  if (status === "rejected") return "red";
  if (status === "pending") return "yellow";
  return "neutral";
}

export default function DashboardClient({ orgId: _orgId, data, error }: Props) {
  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Dashboard" />
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
        <div className="h-10 w-48 rounded bg-elevated" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <StatTile key={i} label="" value="" loading />
          ))}
        </div>
        <div className="h-40 rounded border border-border bg-surface" />
        <div className="h-40 rounded border border-border bg-surface" />
      </div>
    );
  }

  const { businessCount, healthDistribution, topAlerts, recentDecisions, pendingApprovalsCount, revenueAtRisk } = data;
  const totalWithScores = healthDistribution.excellent + healthDistribution.good + healthDistribution.needsAttention + healthDistribution.critical;

  return (
    <div className="flex flex-col gap-8">

      <PageHeader
        title="Dashboard"
        description={businessCount === 0
          ? "No businesses yet. Add your first business to get started."
          : `Monitoring ${businessCount} business${businessCount === 1 ? "" : "es"} across your organization.`}
        action={
          <Link href="/businesses/new">
            <Button>+ Add Business</Button>
          </Link>
        }
      />

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link href="/businesses">
          <StatTile label="Total Businesses" value={businessCount} delta="View all →" trend="neutral" />
        </Link>
        <Link href="/businesses">
          <StatTile
            label="Pending Approvals"
            value={pendingApprovalsCount}
            delta="Review →"
            trend={pendingApprovalsCount > 0 ? "down" : "neutral"}
          />
        </Link>
        <Link href="/businesses">
          <StatTile
            label="Critical Alerts"
            value={healthDistribution.critical}
            delta="View →"
            trend={healthDistribution.critical > 0 ? "down" : "neutral"}
          />
        </Link>
        <StatTile
          label="Revenue at Risk"
          value={`$${revenueAtRisk.toLocaleString()}`}
          trend={revenueAtRisk > 0 ? "down" : "neutral"}
        />
      </div>

      {/* Health Distribution */}
      {totalWithScores > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-text-muted">Health Distribution</h2>
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
            <h2 className="font-display text-base text-text-primary">Top Alerts</h2>
            <Link href="/businesses" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
              All businesses →
            </Link>
          </div>
          {topAlerts.length === 0 ? (
            <EmptyState title="No critical alerts" description="All businesses are healthy." dashed={false} />
          ) : (
            <div className="flex flex-col gap-2">
              {topAlerts.map((alert) => (
                <Link
                  key={alert.businessId}
                  href={`/business/${alert.businessId}/health`}
                  className={`flex items-center gap-4 rounded border px-4 py-3 transition-colors hover:bg-neutral-800/60 ${healthScoreBg(alert.healthScore)}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{alert.businessName}</p>
                    <p className="text-xs text-text-muted">Needs immediate attention</p>
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
            <h2 className="font-display text-base text-text-primary">Recent Decisions</h2>
          </div>
          {recentDecisions.length === 0 ? (
            <EmptyState title="No decisions yet" description="Decisions will appear here as BOSS analyzes your businesses." dashed={false} />
          ) : (
            <div className="flex flex-col gap-2">
              {recentDecisions.slice(0, 5).map((decision) => (
                <Card key={decision.id} padding="sm" className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug text-text-secondary truncate">{decision.objective}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {decision.businessName} ·{" "}
                      {new Date(decision.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <Badge color={decisionStatusColor(decision.status)}>{decision.status}</Badge>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Empty state for new orgs */}
      {businessCount === 0 && (
        <EmptyState
          title="Welcome to BOSS"
          description="Add your first business to unlock AI-powered insights, health tracking, and automated recommendations."
          action={
            <Link href="/business/new" className="rounded bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors">
              Add Your First Business →
            </Link>
          }
        />
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
    <Card padding="sm">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${color}`}>{count}</p>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-elevated">
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-text-muted">{pct}%</p>
    </Card>
  );
}
