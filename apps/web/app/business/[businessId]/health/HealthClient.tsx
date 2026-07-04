"use client";

import Link from "next/link";
import { PageHeader } from "../../../../src/components/ui/PageHeader";
import { Button } from "../../../../src/components/ui/Button";
import { Card } from "../../../../src/components/ui/Card";
import { Badge } from "../../../../src/components/ui/Badge";
import { StatTile } from "../../../../src/components/ui/StatTile";

interface KpiReading {
  kpiKey: string;
  label: string;
  value: number | null;
  unit: string;
  trend: string | null;
}

interface Constraint {
  id: string;
  constraintKey: string;
  status: string;
  severity: string;
  description: string;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  estimatedRoi: { profitImpactAnnual: number };
  confidence: number;
}

interface HealthHistory {
  score: number;
  generatedAt: string;
}

interface Props {
  orgId: string;
  businessId: string;
  businessName: string;
  health: { overallScore: number; generatedAt: string } | null;
  healthHistory: HealthHistory[];
  constraints: Constraint[];
  topRecommendation: Recommendation | null;
  kpis: KpiReading[];
  error: string | null;
}

function healthTone(score: number) {
  if (score >= 80) return { label: "Excellent", color: "text-green-400", bar: "bg-green-500", bg: "border-green-900/50 bg-green-950/20" };
  if (score >= 60) return { label: "Good", color: "text-blue-400", bar: "bg-blue-500", bg: "border-blue-900/50 bg-blue-950/20" };
  if (score >= 40) return { label: "Needs Attention", color: "text-yellow-400", bar: "bg-yellow-500", bg: "border-yellow-900/50 bg-yellow-950/20" };
  return { label: "Critical", color: "text-red-400", bar: "bg-red-500", bg: "border-red-900/50 bg-red-950/20" };
}

function severityBadgeColor(severity: string): "red" | "yellow" | "neutral" {
  if (severity === "critical" || severity === "high") return "red";
  if (severity === "medium") return "yellow";
  return "neutral";
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

function groupConstraintsByCategory(constraints: Constraint[]) {
  const operations: Constraint[] = [];
  const finance: Constraint[] = [];
  const customer: Constraint[] = [];
  const growth: Constraint[] = [];
  const other: Constraint[] = [];

  for (const c of constraints) {
    const key = c.constraintKey.toLowerCase();
    if (key.includes("revenue") || key.includes("cash") || key.includes("cost") || key.includes("profit")) {
      finance.push(c);
    } else if (key.includes("customer") || key.includes("satisfaction") || key.includes("retention")) {
      customer.push(c);
    } else if (key.includes("growth") || key.includes("lead") || key.includes("market")) {
      growth.push(c);
    } else if (key.includes("operation") || key.includes("team") || key.includes("workflow") || key.includes("efficiency")) {
      operations.push(c);
    } else {
      other.push(c);
    }
  }

  const groups: Array<[string, Constraint[]]> = [
    ["finance", finance],
    ["customer", customer],
    ["growth", growth],
    ["operations", operations],
    ["other", other],
  ];
  return groups.filter(([, items]) => items.length > 0);
}

export default function HealthClient({
  orgId: _orgId,
  businessId,
  businessName,
  health,
  healthHistory,
  constraints,
  topRecommendation,
  kpis,
  error,
}: Props) {
  const base = `/business/${businessId}/workspace`;

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Business Health"
          description="Real-time health score, constraints, and AI recommendations."
          back={<Link href={`/business/${businessId}/workspace`} className="text-xs text-text-muted hover:text-text-secondary transition-colors">← {businessName}</Link>}
          action={<Link href={`/business/${businessId}/mri`}><Button variant="secondary" size="sm">Re-run MRI</Button></Link>}
        />
        <div className="rounded border border-red-800 bg-red-950/30 p-5 text-red-400">
          <p className="font-medium">Health data unavailable</p>
          <p className="mt-1 text-sm">{error}</p>
          <Link
            href={`/business/${businessId}/mri`}
            className="mt-4 inline-flex rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
          >
            Run Business MRI →
          </Link>
        </div>
      </div>
    );
  }

  const tone = health ? healthTone(health.overallScore) : null;
  const constraintGroups = groupConstraintsByCategory(constraints);
  const activeConstraints = constraints.filter((c) => c.status === "active");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
          title="Business Health"
          description="Real-time health score, constraints, and AI recommendations."
          back={<Link href={`/business/${businessId}/workspace`} className="text-xs text-text-muted hover:text-text-secondary transition-colors">← {businessName}</Link>}
          action={<Link href={`/business/${businessId}/mri`}><Button variant="secondary" size="sm">Re-run MRI</Button></Link>}
        />

      {/* Health Score + Trend */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Score Card */}
        {health && tone ? (
          <section className={`rounded border p-6 ${tone.bg}`}>
            <p className="text-xs font-medium uppercase tracking-widest text-text-muted">Business Health Score</p>
            <div className="mt-3 flex items-baseline gap-3">
              <span className={`font-display text-7xl font-black ${tone.color}`}>{health.overallScore}</span>
              <span className="text-2xl text-text-muted">/ 100</span>
            </div>
            <p className={`mt-1 text-sm font-medium ${tone.color}`}>{tone.label}</p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-elevated">
              <div
                className={`h-full rounded-full ${tone.bar} transition-all`}
                style={{ width: `${health.overallScore}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-text-muted">
              Last updated {new Date(health.generatedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <StatTile label="Active Constraints" value={activeConstraints.length} trend={activeConstraints.length > 0 ? "down" : "neutral"} />
              <StatTile label="Recommendations" value={topRecommendation ? "1+" : "0"} trend="neutral" />
            </div>
          </section>
        ) : (
          <Card padding="lg">
            <p className="font-medium text-text-primary">No health score yet</p>
            <p className="mt-2 text-sm text-text-muted">
              Complete the Business MRI to generate your health score and unlock AI insights.
            </p>
            <Link
              href={`/business/${businessId}/mri`}
              className="mt-4 inline-flex rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            >
              Start Business MRI →
            </Link>
          </Card>
        )}

        {/* Health History */}
        <Card padding="lg">
          <p className="text-xs font-medium uppercase tracking-widest text-text-muted">Score History</p>
          {healthHistory.length === 0 ? (
            <div className="mt-4 flex h-24 items-center justify-center">
              <p className="text-sm text-text-muted">No history available yet.</p>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {healthHistory.slice(-5).reverse().map((h, i) => {
                const t = healthTone(h.score);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-text-muted">
                      {new Date(h.generatedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                    <div className="flex-1 h-2 overflow-hidden rounded-full bg-elevated">
                      <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${h.score}%` }} />
                    </div>
                    <span className={`w-8 shrink-0 text-right text-xs font-medium ${t.color}`}>{h.score}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* KPI Tiles */}
      {kpis.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-text-muted">Key Metrics</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {kpis.slice(0, 8).map((kpi) => (
              <StatTile
                key={kpi.kpiKey}
                label={kpi.label}
                value={formatKpiValue(kpi.value, kpi.unit)}
                trend={kpi.trend === "up" ? "up" : kpi.trend === "down" ? "down" : "neutral"}
              />
            ))}
          </div>
        </section>
      )}

      {/* Top Recommendation */}
      {topRecommendation && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-text-muted">Top Recommendation</h2>
          <Card>
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary">{topRecommendation.title}</p>
                <p className="mt-1 text-sm text-text-muted">{topRecommendation.description}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
                  <span>ROI: <strong className="text-green-400">${topRecommendation.estimatedRoi.profitImpactAnnual.toLocaleString()}/yr</strong></span>
                  <span>Confidence: {Math.round(topRecommendation.confidence * 100)}%</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <Link
                  href={`${base}/approvals`}
                  className="rounded bg-green-800 px-4 py-2 text-xs font-medium text-white hover:bg-green-700 transition-colors text-center"
                >
                  Approve
                </Link>
                <Link
                  href={`${base}/recommendations`}
                  className="rounded border border-border px-4 py-2 text-xs text-text-muted hover:border-border-strong hover:text-text-primary transition-colors text-center"
                >
                  View All
                </Link>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Constraint Breakdown */}
      {constraintGroups.length > 0 ? (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-text-muted">Constraint Breakdown</h2>
          <div className="flex flex-col gap-6">
            {constraintGroups.map(([category, items]) => (
              <div key={category}>
                <p className="mb-2 text-xs font-medium capitalize text-text-secondary">{category}</p>
                <div className="flex flex-col gap-2">
                  {items.map((c) => (
                    <Card key={c.id} padding="sm" className="flex items-start gap-3">
                      <Badge color={severityBadgeColor(c.severity)}>{c.severity}</Badge>
                      <p className="flex-1 min-w-0 text-sm text-text-secondary">{c.description}</p>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : health ? (
        <Card padding="md" className="text-center">
          <p className="text-sm font-medium text-green-400">No active constraints</p>
          <p className="mt-1 text-xs text-text-muted">Your business is operating without known blockers.</p>
        </Card>
      ) : null}

      {/* Navigation shortcuts */}
      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-text-muted">Quick Navigation</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Workspace", href: base },
            { label: "Approvals", href: `${base}/approvals` },
            { label: "Recommendations", href: `${base}/recommendations` },
            { label: "Intelligence", href: `${base}/intelligence` },
            { label: "Timeline", href: `${base}/timeline` },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded border border-border px-3 py-1.5 text-xs text-text-muted hover:border-border-strong hover:text-text-primary transition-colors"
            >
              {link.label} →
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
