import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { DEMO_ORG_ID } from "../../../../../src/lib/demoOrg";
import { DecisionActions, RecommendationActions } from "./ApprovalActions";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function ApprovalsPage({ params }: Props) {
  const { businessId } = await params;
  let queue;
  try {
    queue = await apiClient.getPendingApprovals(DEMO_ORG_ID, businessId);
  } catch (error) {
    const message = error instanceof ApiClientError ? error.body.message : "Failed to load approvals.";
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-3xl">Approval Center</h1>
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
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Approval Center</h1>
        {hasWork && (
          <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-medium text-white">
            {queue.totalPending} pending
          </span>
        )}
      </div>

      {!hasWork ? (
        <div className="rounded border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-400">
          <p className="text-lg font-medium">All caught up</p>
          <p className="mt-1 text-sm">No decisions or recommendations awaiting your approval.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {queue.pendingDecisions.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg text-neutral-300">
                Decisions ({queue.pendingDecisions.length})
              </h2>
              <div className="flex flex-col gap-3">
                {queue.pendingDecisions.map((d) => (
                  <div key={d.id} className="rounded border border-neutral-800 bg-neutral-900 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{d.objective}</p>
                        <p className="mt-1 text-sm text-neutral-400">
                          Confidence: {Math.round(d.confidenceScore * 100)}%
                        </p>
                      </div>
                      <span className="rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-400 shrink-0">
                        {d.status}
                      </span>
                    </div>
                    <DecisionActions decisionId={d.id} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {queue.pendingRecommendations.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg text-neutral-300">
                Recommendations ({queue.pendingRecommendations.length})
              </h2>
              <div className="flex flex-col gap-3">
                {queue.pendingRecommendations.map((r) => (
                  <div key={r.id} className="rounded border border-neutral-800 bg-neutral-900 p-4">
                    <div className="flex items-start justify-between">
                      <p className="font-medium">{r.title}</p>
                      <span className="rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-400">{r.status}</span>
                    </div>
                    <RecommendationActions recommendationId={r.id} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
