/**
 * Customer Success Workspace — internal only, not linked from customer UI.
 * Accessible at /cs for CS team members.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

interface CustomerHealthScore {
  businessId: string;
  orgId: string;
  score: number;
  tier: "champion" | "healthy" | "at_risk" | "critical";
  signals: {
    mriCompleted: boolean;
    workspaceViewedRecently: boolean;
    decisionApproved: boolean;
    activeWorkflows: boolean;
    feedbackSubmitted: boolean;
  };
  computedAt: string;
}

interface ActivationResult {
  activated: number;
  total: number;
  rate: number;
}

async function getHealthScores(): Promise<CustomerHealthScore[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/cs/health`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as CustomerHealthScore[]) : [];
  } catch {
    return [];
  }
}

async function getActivation(): Promise<ActivationResult | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/analytics/activation`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as ActivationResult) : null;
  } catch {
    return null;
  }
}

async function getWab(): Promise<number | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/analytics/wab`, { cache: "no-store" });
    const body = res.ok ? ((await res.json()) as { wab: number }) : null;
    return body?.wab ?? null;
  } catch {
    return null;
  }
}

const TIER_COLORS: Record<CustomerHealthScore["tier"], string> = {
  champion: "text-green-400 bg-green-900/30",
  healthy: "text-blue-400 bg-blue-900/30",
  at_risk: "text-yellow-400 bg-yellow-900/30",
  critical: "text-red-400 bg-red-900/30",
};

function Signal({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${active ? "text-green-400" : "text-neutral-600"}`}>
      <span>{active ? "✓" : "○"}</span>
      {label}
    </span>
  );
}

export default async function CsPage() {
  const [scores, activation, wab] = await Promise.all([getHealthScores(), getActivation(), getWab()]);

  const champions = scores.filter((s) => s.tier === "champion").length;
  const atRisk = scores.filter((s) => s.tier === "at_risk" || s.tier === "critical").length;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <div>
        <p className="text-sm text-neutral-500">Internal — Customer Success</p>
        <h1 className="mt-1 font-display text-3xl">CS Workspace</h1>
      </div>

      {/* Beta Cohort Metrics */}
      <section>
        <h2 className="mb-3 font-display text-lg text-neutral-300">Beta Cohort Metrics</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">Total Businesses</p>
            <p className="mt-1 text-2xl font-bold text-white">{scores.length}</p>
          </div>
          <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">Activated</p>
            <p className="mt-1 text-2xl font-bold text-white">{activation?.activated ?? "—"}</p>
            {activation && (
              <p className="mt-0.5 text-xs text-neutral-500">{(activation.rate * 100).toFixed(0)}% rate</p>
            )}
          </div>
          <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">WAB (7d)</p>
            <p className="mt-1 text-2xl font-bold text-white">{wab ?? "—"}</p>
          </div>
          <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">Champions</p>
            <p className="mt-1 text-2xl font-bold text-green-400">{champions}</p>
            <p className="mt-0.5 text-xs text-neutral-500">{atRisk} at risk</p>
          </div>
        </div>
      </section>

      {/* Customer Health List */}
      <section>
        <h2 className="mb-3 font-display text-lg text-neutral-300">Customer Health</h2>
        {scores.length === 0 ? (
          <div className="rounded border border-neutral-800 bg-neutral-900 p-8 text-center">
            <p className="text-neutral-500">No customers yet. Activate <code className="text-neutral-400">beta_onboarding</code> flag and generate invite codes.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {scores
              .sort((a, b) => b.score - a.score)
              .map((s) => (
                <div
                  key={`${s.orgId}:${s.businessId}`}
                  className="flex items-center justify-between rounded border border-neutral-800 bg-neutral-900 px-4 py-3"
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-mono text-neutral-300">{s.businessId.slice(0, 8)}…</p>
                    <div className="flex flex-wrap gap-3">
                      <Signal label="MRI" active={s.signals.mriCompleted} />
                      <Signal label="Workspace" active={s.signals.workspaceViewedRecently} />
                      <Signal label="Decision" active={s.signals.decisionApproved} />
                      <Signal label="Workflow" active={s.signals.activeWorkflows} />
                      <Signal label="Feedback" active={s.signals.feedbackSubmitted} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-white">{s.score}</span>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${TIER_COLORS[s.tier]}`}>
                      {s.tier.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg text-neutral-300">Actions</h2>
        <div className="flex gap-3 text-sm">
          <a
            href="/ops"
            className="rounded border border-neutral-700 bg-neutral-900 px-4 py-2 text-neutral-300 hover:text-white transition-colors"
          >
            Platform Ops →
          </a>
        </div>
      </section>
    </main>
  );
}
