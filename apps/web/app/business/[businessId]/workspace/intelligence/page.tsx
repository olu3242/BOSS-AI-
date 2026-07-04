import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";
import { EmptyState } from "../../../../../src/components/ui/EmptyState";
import { PageHeader } from "../../../../../src/components/ui/PageHeader";
import { Card } from "../../../../../src/components/ui/Card";
import { Badge } from "../../../../../src/components/ui/Badge";

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
        <PageHeader title="Intelligence" />
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
      <PageHeader title="Intelligence" description="AI signals, KPIs, root causes, and the decision pipeline." />

      {/* KPI Readings */}
      <section>
        <h2 className="mb-3 font-display text-lg text-text-primary">KPI Readings</h2>
        {kpis.readings.length === 0 ? (
          <EmptyState
            title="No KPI data yet"
            description="Run a health assessment to generate KPI readings."
            dashed={false}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {kpis.readings.map((kpi) => (
              <Card key={kpi.kpiKey} padding="sm">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wide">{kpi.kpiKey}</p>
                <p className="mt-1 text-sm text-text-secondary">{kpi.label}</p>
                <p className="mt-2 text-2xl font-bold text-text-primary">
                  {kpi.value !== null ? kpi.value : <span className="text-text-muted">N/A</span>}
                  {kpi.value !== null && kpi.unit !== "count" && (
                    <span className="ml-1 text-sm font-normal text-text-muted">{kpi.unit}</span>
                  )}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Root Cause Analysis */}
      <section>
        <h2 className="mb-3 font-display text-lg text-text-primary">Active Intelligence Signals</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded border border-red-900/50 bg-red-950/20 p-4">
            <p className="text-xs text-red-400 uppercase tracking-wide">High-Severity Causes</p>
            <p className="mt-1 text-3xl font-bold text-red-300">{activeConstraintCount}</p>
            <p className="mt-1 text-xs text-text-muted">Root causes blocking business performance</p>
          </div>
          <div className="rounded border border-blue-900/50 bg-blue-950/20 p-4">
            <p className="text-xs text-blue-400 uppercase tracking-wide">Decisions in Pipeline</p>
            <p className="mt-1 text-3xl font-bold text-blue-300">{decisions.length}</p>
            <p className="mt-1 text-xs text-text-muted">Generated, pending review, or executing</p>
          </div>
        </div>
        {chains.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {chains.map((chain, i) => (
              <Card key={i} padding="sm" className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">{chain.rootCauseLabel}</span>
                  {chain.affectedKpiKeys.length > 0 && (
                    <p className="mt-1 text-xs text-text-muted">Affects: {chain.affectedKpiKeys.join(", ")}</p>
                  )}
                </div>
                <Badge
                  color={
                    chain.severity === "critical" ? "red"
                    : chain.severity === "high" ? "red"
                    : "yellow"
                  }
                >
                  {chain.severity}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Decision Pipeline */}
      {decisions.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg text-text-primary">Decision Pipeline</h2>
          <div className="flex flex-col gap-2">
            {decisions.map((d) => (
              <Card key={d.id} padding="sm" className="flex items-center justify-between">
                <span className="text-sm">{d.objective}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-muted">
                    {Math.round(d.confidenceScore * 100)}%
                  </span>
                  <Badge
                    color={
                      d.status === "approved" || d.status === "completed" ? "green"
                      : d.status === "generated" || d.status === "reviewed" ? "yellow"
                      : "neutral"
                    }
                  >
                    {d.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
