import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";
import { EmptyState } from "../../../../../src/components/ui/EmptyState";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function AutomationPage({ params }: Props) {
  const { businessId } = await params;
  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;
  let integrations;
  let executions;

  try {
    [integrations, executions] = await Promise.all([
      apiClient.getIntegrations(orgId, businessId),
      apiClient.getToolExecutions(orgId, businessId),
    ]);
  } catch (error) {
    const message = error instanceof ApiClientError ? error.body.message : "Failed to load automation data.";
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-3xl">Automation Center</h1>
        <div className="rounded border border-red-800 bg-red-950/30 p-4 text-red-400">
          <p className="font-medium">Failed to load automation data</p>
          <p className="mt-1 text-sm">{message}</p>
        </div>
      </div>
    );
  }

  const allIntegrations = Array.isArray(integrations) ? integrations : [];
  const connected = allIntegrations.filter((i) => i.status === "connected");
  const allExecutions = Array.isArray(executions) ? executions : [];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl">Automation Center</h1>

      {/* Integrations */}
      <section>
        <h2 className="mb-3 font-display text-lg text-neutral-300">
          Integrations ({connected.length} connected)
        </h2>
        {allIntegrations.length === 0 ? (
          <EmptyState
            title="No integrations configured"
            description="Connect your tools (Slack, email, CRM) to enable automation."
            dashed={false}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {allIntegrations.map((integration) => (
              <div
                key={integration.providerKey}
                className="flex items-center justify-between rounded border border-neutral-800 bg-neutral-900 px-4 py-3"
              >
                <span className="font-medium capitalize">{integration.providerKey.replace(/_/g, " ")}</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    integration.status === "connected"
                      ? "bg-green-900/50 text-green-400"
                      : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {integration.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Tool Executions */}
      <section>
        <h2 className="mb-3 font-display text-lg text-neutral-300">
          Recent Executions ({allExecutions.length})
        </h2>
        {allExecutions.length === 0 ? (
          <EmptyState
            title="No tool executions yet"
            description="Tool executions appear here when the operating loop runs automated actions."
            dashed={false}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {allExecutions.slice(0, 20).map((execution) => (
              <div
                key={execution.id}
                className="flex items-center justify-between rounded border border-neutral-800 bg-neutral-900 px-4 py-3"
              >
                <div>
                  <span className="text-sm font-medium capitalize">
                    {execution.providerKey} — {execution.toolKey}
                  </span>
                  <p className="text-xs text-neutral-500">
                    {new Date(execution.startedAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    execution.status === "succeeded"
                      ? "bg-green-900/50 text-green-400"
                      : execution.status === "failed"
                        ? "bg-red-900/50 text-red-400"
                        : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {execution.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
