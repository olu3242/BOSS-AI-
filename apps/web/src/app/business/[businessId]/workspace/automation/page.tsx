import { apiClient, ApiClientError } from "../../../../../lib/apiClient";
import { DEMO_ORG_ID } from "../../../../../lib/demoOrg";

interface Props {
  params: { businessId: string };
}

export default async function AutomationPage({ params }: Props) {
  let integrations;
  let executions;

  try {
    [integrations, executions] = await Promise.all([
      apiClient.getIntegrations(DEMO_ORG_ID, params.businessId),
      apiClient.getToolExecutions(DEMO_ORG_ID, params.businessId),
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

  const allIntegrations = integrations.integrations ?? [];
  const connected = allIntegrations.filter((i) => i.status === "connected");
  const allExecutions = executions.executions ?? [];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl">Automation Center</h1>

      {/* Integrations */}
      <section>
        <h2 className="mb-3 font-display text-lg text-neutral-300">
          Integrations ({connected.length} connected)
        </h2>
        {allIntegrations.length === 0 ? (
          <div className="rounded border border-neutral-800 bg-neutral-900 p-6 text-neutral-400">
            <p>No integrations configured.</p>
            <p className="mt-1 text-sm">Connect your tools (Slack, email, CRM) to enable automation.</p>
          </div>
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
          <div className="rounded border border-neutral-800 bg-neutral-900 p-6 text-neutral-400">
            <p>No tool executions yet.</p>
            <p className="mt-1 text-sm">Tool executions appear here when the operating loop runs automated actions.</p>
          </div>
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
                    {new Date(execution.executedAt).toLocaleString()}
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
