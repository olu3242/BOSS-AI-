import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";
import { EmptyState } from "../../../../../src/components/ui/EmptyState";
import { PageHeader } from "../../../../../src/components/ui/PageHeader";
import { Card } from "../../../../../src/components/ui/Card";
import { Badge } from "../../../../../src/components/ui/Badge";
import { DecisionActions, RecommendationActions } from "./ApprovalActions";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function ApprovalsPage({ params }: Props) {
  const { businessId } = await params;
  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;
  let queue;
  try {
    queue = await apiClient.getPendingApprovals(orgId, businessId);
  } catch (error) {
    const message = error instanceof ApiClientError ? error.body.message : "Failed to load approvals.";
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Approval Center" />
        <div className="rounded border border-red-800 bg-red-950/30 p-4 text-red-400">
          <p className="font-medium">Failed to load approvals</p>
          <p className="mt-1 text-sm">{message}</p>
        </div>
      </div>
    );
  }

  const hasWork = queue.totalPending > 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Approval Center"
        action={hasWork ? (
          <Badge color="red">{queue.totalPending} pending</Badge>
        ) : undefined}
      />

      {!hasWork ? (
        <EmptyState
          title="All caught up"
          description="No decisions or recommendations awaiting your approval."
          dashed={false}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {queue.pendingDecisions.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg text-text-primary">
                Decisions ({queue.pendingDecisions.length})
              </h2>
              <div className="flex flex-col gap-3">
                {queue.pendingDecisions.map((d) => (
                  <Card key={d.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{d.objective}</p>
                        <p className="mt-1 text-sm text-text-muted">
                          Confidence: {Math.round(d.confidenceScore * 100)}%
                        </p>
                      </div>
                      <Badge color="neutral">{d.status}</Badge>
                    </div>
                    <DecisionActions decisionId={d.id} orgId={orgId} />
                  </Card>
                ))}
              </div>
            </section>
          )}

          {queue.pendingRecommendations.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg text-text-primary">
                Recommendations ({queue.pendingRecommendations.length})
              </h2>
              <div className="flex flex-col gap-3">
                {queue.pendingRecommendations.map((r) => (
                  <Card key={r.id}>
                    <div className="flex items-start justify-between">
                      <p className="font-medium">{r.title}</p>
                      <Badge color="neutral">{r.status}</Badge>
                    </div>
                    <RecommendationActions recommendationId={r.id} orgId={orgId} businessId={businessId} />
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
