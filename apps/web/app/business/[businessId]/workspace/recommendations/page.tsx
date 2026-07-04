import Link from "next/link";
import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";
import { EmptyState } from "../../../../../src/components/ui/EmptyState";
import { RecommendationActions } from "../approvals/ApprovalActions";

interface Props {
  params: Promise<{ businessId: string }>;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  low: "Easy",
  medium: "Moderate",
  high: "Complex",
};

const STATUS_STYLE: Record<string, string> = {
  proposed: "bg-yellow-900/50 text-yellow-400 border-yellow-900/50",
  approved: "bg-green-900/50 text-green-400 border-green-900/50",
  dismissed: "bg-neutral-800 text-neutral-500 border-neutral-700",
  completed: "bg-blue-900/50 text-blue-400 border-blue-900/50",
};

const CATEGORY_LABEL: Record<string, string> = {
  revenue_growth: "Revenue",
  cost_reduction: "Cost",
  customer_retention: "Retention",
  operational_efficiency: "Efficiency",
  lead_generation: "Leads",
  reputation: "Reputation",
};

export default async function RecommendationsPage({ params }: Props) {
  const { businessId } = await params;
  const base = `/business/${businessId}/workspace`;

  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;

  let recommendations: Awaited<ReturnType<typeof apiClient.listRecommendations>> = [];
  let priorities: Awaited<ReturnType<typeof apiClient.getRecommendationPriorities>> = [];

  try {
    [recommendations, priorities] = await Promise.all([
      apiClient.listRecommendations(orgId, businessId),
      apiClient.getRecommendationPriorities(orgId, businessId).catch(() => []),
    ]);
  } catch (error) {
    const message = error instanceof ApiClientError ? error.body.message : "Failed to load recommendations.";
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-3xl">AI Recommendations</h1>
        <div className="rounded border border-red-800 bg-red-950/30 p-4 text-red-400">
          <p className="font-medium">Failed to load recommendations</p>
          <p className="mt-1 text-sm">{message}</p>
        </div>
      </div>
    );
  }

  const priorityByRecId = new Map(priorities.map((p) => [p.recommendationId, p]));

  const sorted = [...recommendations].sort((a, b) => {
    const pa = priorityByRecId.get(a.id)?.rank ?? 999;
    const pb = priorityByRecId.get(b.id)?.rank ?? 999;
    return pa - pb;
  });

  const proposed = sorted.filter((r) => r.status === "proposed");
  const approved = sorted.filter((r) => r.status === "approved");
  const dismissed = sorted.filter((r) => r.status === "dismissed");

  return (
    <div className="flex flex-col gap-8">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">AI Recommendations</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {recommendations.length} total · {proposed.length} pending your review
          </p>
        </div>
        <Link
          href={base}
          className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          ← Command Center
        </Link>
      </div>

      {recommendations.length === 0 && (
        <EmptyState
          title="No recommendations yet"
          description="Complete the Business MRI to generate AI-powered recommendations."
          action={
            <Link
              href={`/business/${businessId}/mri`}
              className="rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            >
              Start Business MRI
            </Link>
          }
        />
      )}

      {/* ── PROPOSED (awaiting action) ────────────────────────── */}
      {proposed.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-lg text-neutral-300">
            Awaiting Your Review
            <span className="ml-2 rounded-full bg-yellow-600 px-2 py-0.5 text-xs font-medium text-white">
              {proposed.length}
            </span>
          </h2>
          <div className="flex flex-col gap-4">
            {proposed.map((rec) => {
              const priority = priorityByRecId.get(rec.id);
              return (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  priority={priority}
                  showActions
                  orgId={orgId}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* ── APPROVED ──────────────────────────────────────────── */}
      {approved.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-lg text-neutral-300">Approved</h2>
          <div className="flex flex-col gap-3">
            {approved.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} priority={priorityByRecId.get(rec.id)} />
            ))}
          </div>
        </section>
      )}

      {/* ── DISMISSED ─────────────────────────────────────────── */}
      {dismissed.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-lg text-neutral-300 opacity-60">Dismissed</h2>
          <div className="flex flex-col gap-3 opacity-60">
            {dismissed.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} priority={priorityByRecId.get(rec.id)} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}

interface RecType {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  difficulty: string;
  estimatedEffortHours: number;
  estimatedCost: number;
  estimatedRoi: { profitImpactAnnual: number };
  estimatedTimeToValueDays: number;
  confidence: number;
  relatedKpiKeys: string[];
}

function RecommendationCard({
  rec,
  priority,
  showActions = false,
  orgId = "",
}: {
  rec: RecType;
  priority?: { priority: string; rank: number };
  showActions?: boolean;
  orgId?: string;
}) {
  return (
    <article className="rounded border border-neutral-800 bg-neutral-900 p-5">
      <div className="flex items-start gap-4">
        {priority && (
          <div className="shrink-0 text-center">
            <span className="font-display text-2xl font-black text-neutral-600">#{priority.rank}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-medium text-white">{rec.title}</h3>
            <div className="flex shrink-0 items-center gap-2">
              {priority && (
                <span className="rounded border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-neutral-400 uppercase tracking-wide">
                  {priority.priority}
                </span>
              )}
              <span className={`rounded border px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[rec.status] ?? "bg-neutral-800 text-neutral-400 border-neutral-700"}`}>
                {rec.status}
              </span>
            </div>
          </div>

          <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{rec.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-neutral-500">
            <span>
              Category:{" "}
              <span className="text-neutral-300">
                {CATEGORY_LABEL[rec.category] ?? rec.category.replace(/_/g, " ")}
              </span>
            </span>
            <span>
              Difficulty:{" "}
              <span className="text-neutral-300">{DIFFICULTY_LABEL[rec.difficulty] ?? rec.difficulty}</span>
            </span>
            <span>
              Effort:{" "}
              <span className="text-neutral-300">{rec.estimatedEffortHours}h</span>
            </span>
            <span>
              Time-to-value:{" "}
              <span className="text-neutral-300">{rec.estimatedTimeToValueDays} days</span>
            </span>
            <span>
              Confidence:{" "}
              <span className="text-neutral-300">{Math.round(rec.confidence * 100)}%</span>
            </span>
          </div>

          {rec.estimatedRoi.profitImpactAnnual > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded bg-green-950/50 border border-green-900/50 px-3 py-1.5">
              <span className="text-xs text-green-400 font-medium">
                Estimated ROI: +${rec.estimatedRoi.profitImpactAnnual.toLocaleString()}/yr
              </span>
            </div>
          )}

          {rec.relatedKpiKeys.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {rec.relatedKpiKeys.map((k) => (
                <span key={k} className="rounded bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-500">
                  {k.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}

          {showActions && (
            <div className="mt-4 border-t border-neutral-800 pt-4">
              <RecommendationActions recommendationId={rec.id} orgId={orgId} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
