import { apiClient, ApiClientError } from "../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../src/server/auth";
import { PageHeader } from "../../../../src/components/ui/PageHeader";
import { Card } from "../../../../src/components/ui/Card";
import { Badge } from "../../../../src/components/ui/Badge";
import { EmptyState } from "../../../../src/components/ui/EmptyState";

export default async function MissionControlPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;
  let snapshot;
  try {
    snapshot = await apiClient.getMissionControlSnapshot(orgId, businessId);
  } catch (error) {
    const message = error instanceof ApiClientError ? error.body.message : "Failed to load Mission Control.";
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <PageHeader title="Mission Control" />
        <p className="mt-4 text-status-danger">{message}</p>
      </main>
    );
  }

  const hasActivity = snapshot.workflows.length > 0 || snapshot.timeline.length > 0;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
      <PageHeader title="Mission Control" />

      {!hasActivity ? (
        <EmptyState
          title="No execution evidence yet"
          description="Run a Business MRI and approve a recommendation to see workflows here."
          dashed={false}
        />
      ) : (
        <>
          <section>
            <h2 className="mb-3 font-display text-xl text-text-primary">Workflows</h2>
            <ul className="flex flex-col gap-2">
              {snapshot.workflows.map((workflow) => (
                <Card key={workflow.id} padding="sm" className="flex items-center justify-between">
                  <span className="font-medium">{workflow.workflowKey}</span>
                  <Badge color="neutral">{workflow.state}</Badge>
                </Card>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl text-text-primary">Timeline</h2>
            <ul className="flex flex-col gap-2">
              {snapshot.timeline.map((entry) => (
                <Card key={entry.id} padding="sm" className="text-sm">
                  <span className="text-text-muted">{entry.occurredAt}</span> — {entry.description}
                </Card>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
