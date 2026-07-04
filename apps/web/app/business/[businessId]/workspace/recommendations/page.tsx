import Link from "next/link";
import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";
import { EmptyState } from "../../../../../src/components/ui/EmptyState";
import { PageHeader } from "../../../../../src/components/ui/PageHeader";
import { Card } from "../../../../../src/components/ui/Card";
import { Badge } from "../../../../../src/components/ui/Badge";
import { RecommendationActions } from "../approvals/ApprovalActions";

interface Props {
  params: Promise<{ businessId: string }>;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  low: "Easy",
  medium: "Moderate",
  high: "Complex",
};

function statusBadgeColor(status: string): "yellow" | "green" | "blue" | "neutral" {
  if (status === "proposed") return "yellow";
  if (status === "approved") return "green";
  if (status === "completed") return "blue";
  return "neutral";
}

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
        <PageHeader title="AI Recommendations" />
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

      <PageHeader
        title="AI Recommendations"
        description={`${recommendations.length} total · ${proposed.length} pending your review`}
        back={<Link href={base} className="text-xs text-text-muted hover:text-text-secondary transition-colors">← Command Center</Link>}
      />

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
          <h2 className="mb-4 font-display text-lg text-text-primary">
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
          <h2 className="mb-4 font-display text-lg text-text-primary">Approved</h2>
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
          <h2 className="mb-4 font-display text-lg text-text-primary opacity-60">Dismissed</h2>
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
    <Card>
      <div className="flex items-start gap-4">
        {priority && (
          <div className="shrink-0 text-center">
            <span className="font-display text-2xl font-black text-text-muted">#{priority.rank}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-medium text-text-primary">{rec.title}</h3>
            <div className="flex shrink-0 items-center gap-2">
              {priority && (
                <Badge color="neutral">{priority.priority}</Badge>
              )}
              <Badge color={statusBadgeColor(rec.status)}>{rec.status}</Badge>
            </div>
          </div>

          <p className="mt-2 text-sm text-text-muted leading-relaxed">{rec.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-muted">
            <span>
              Category:{" "}
              <span className="text-text-secondary">
                {CATEGORY_LABEL[rec.category] ?? rec.category.replace(/_/g, " ")}
              </span>
            </span>
            <span>
              Difficulty:{" "}
              <span className="text-text-secondary">{DIFFICULTY_LABEL[rec.difficulty] ?? rec.difficulty}</span>
            </span>
            <span>
              Effort:{" "}
              <span className="text-text-secondary">{rec.estimatedEffortHours}h</span>
            </span>
            <span>
              Time-to-value:{" "}
              <span className="text-text-secondary">{rec.estimatedTimeToValueDays} days</span>
            </span>
            <span>
              Confidence:{" "}
              <span className="text-text-secondary">{Math.round(rec.confidence * 100)}%</span>
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
                <Badge key={k} color="neutral">{k.replace(/_/g, " ")}</Badge>
              ))}
            </div>
          )}

          {showActions && (
            <div className="mt-4 border-t border-border pt-4">
              <RecommendationActions recommendationId={rec.id} orgId={orgId} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
