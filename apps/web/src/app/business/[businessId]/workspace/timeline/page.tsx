import { apiClient, ApiClientError } from "../../../../../lib/apiClient";
import { DEMO_ORG_ID } from "../../../../../lib/demoOrg";

interface Props {
  params: { businessId: string };
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  "business.created": "Business Created",
  "business.mri.completed": "MRI Completed",
  "business.dna.derived": "DNA Derived",
  "business.health.calculated": "Health Score Updated",
  "business.constraint.detected": "Constraint Detected",
  "business.recommendation.generated": "Recommendation Generated",
  "business.decision.generated": "Decision Generated",
  "business.plan.created": "Execution Plan Created",
  "business.loop.completed": "Operating Loop Completed",
  "business.outcome.verified": "Outcome Verified",
  "business.learning.recorded": "Learning Recorded",
  "business.kpi.measured": "KPI Measured",
  "business.rootcause.detected": "Root Cause Detected",
  "workflow.instance.completed": "Workflow Completed",
};

export default async function TimelinePage({ params }: Props) {
  let data;
  try {
    data = await apiClient.getTimeline(DEMO_ORG_ID, params.businessId);
  } catch (error) {
    const message = error instanceof ApiClientError ? error.body.message : "Failed to load timeline.";
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-3xl">Business Timeline</h1>
        <div className="rounded border border-red-800 bg-red-950/30 p-4 text-red-400">
          <p className="font-medium">Failed to load timeline</p>
          <p className="mt-1 text-sm">{message}</p>
        </div>
      </div>
    );
  }

  const entries = "entries" in data ? data.entries : (data as { id: string; type: string; description: string; occurredAt: string }[]);
  const timeline = Array.isArray(entries) ? entries : [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Business Timeline</h1>

      {timeline.length === 0 ? (
        <div className="rounded border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-400">
          <p className="font-medium">No events yet</p>
          <p className="mt-1 text-sm">Events appear here as your business progresses through BOSS.</p>
        </div>
      ) : (
        <div className="relative flex flex-col">
          <div className="absolute left-4 top-0 h-full w-px bg-neutral-800" />
          {timeline.map((entry) => (
            <div key={entry.id} className="relative flex gap-4 pb-6 pl-10">
              <div className="absolute left-3 top-1 h-2.5 w-2.5 rounded-full border border-neutral-700 bg-neutral-900" />
              <div className="flex-1 rounded border border-neutral-800 bg-neutral-900 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {EVENT_TYPE_LABELS[entry.type] ?? entry.type}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-400">{entry.description}</p>
                  </div>
                  <time className="shrink-0 text-xs text-neutral-500">
                    {new Date(entry.occurredAt).toLocaleString()}
                  </time>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
