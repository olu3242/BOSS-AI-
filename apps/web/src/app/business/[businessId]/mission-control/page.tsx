import { apiClient, ApiClientError } from "../../../../lib/apiClient";
import { DEMO_ORG_ID } from "../../../../lib/demoOrg";

export default async function MissionControlPage({ params }: { params: { businessId: string } }) {
  let snapshot;
  try {
    snapshot = await apiClient.getMissionControlSnapshot(DEMO_ORG_ID, params.businessId);
  } catch (error) {
    const message = error instanceof ApiClientError ? error.body.message : "Failed to load Mission Control.";
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl">Mission Control</h1>
        <p className="mt-4 text-red-400">{message}</p>
      </main>
    );
  }

  const hasActivity = snapshot.workflows.length > 0 || snapshot.timeline.length > 0;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
      <h1 className="font-display text-3xl">Mission Control</h1>

      {!hasActivity ? (
        <p className="text-neutral-400">
          No execution evidence yet. Run a Business MRI and approve a recommendation to see workflows here.
        </p>
      ) : (
        <>
          <section>
            <h2 className="font-display text-xl">Workflows</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {snapshot.workflows.map((workflow) => (
                <li key={workflow.id} className="rounded border border-neutral-800 px-4 py-3">
                  <span className="font-medium">{workflow.workflowKey}</span>
                  <span className="ml-2 text-sm text-neutral-400">{workflow.state}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl">Timeline</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {snapshot.timeline.map((entry) => (
                <li key={entry.id} className="rounded border border-neutral-800 px-4 py-3 text-sm">
                  <span className="text-neutral-400">{entry.occurredAt}</span> — {entry.description}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
