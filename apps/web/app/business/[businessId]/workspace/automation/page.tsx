import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";
import { EmptyState } from "../../../../../src/components/ui/EmptyState";
import { PageHeader } from "../../../../../src/components/ui/PageHeader";
import { Card } from "../../../../../src/components/ui/Card";
import { Badge } from "../../../../../src/components/ui/Badge";

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
        <PageHeader title="Automation Center" />
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
      <PageHeader title="Automation Center" description="Connect your tools and monitor automated workflow executions." />

      {/* Integrations */}
      <section>
        <h2 className="mb-3 font-display text-lg text-text-primary">
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
              <Card key={integration.providerKey} padding="sm" className="flex items-center justify-between">
                <span className="font-medium capitalize">{integration.providerKey.replace(/_/g, " ")}</span>
                <Badge color={integration.status === "connected" ? "green" : "neutral"}>
                  {integration.status}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Recent Tool Executions */}
      <section>
        <h2 className="mb-3 font-display text-lg text-text-primary">
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
              <Card key={execution.id} padding="sm" className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium capitalize">
                    {execution.providerKey} — {execution.toolKey}
                  </span>
                  <p className="text-xs text-text-muted">
                    {new Date(execution.startedAt).toLocaleString()}
                  </p>
                </div>
                <Badge
                  color={
                    execution.status === "succeeded" ? "green"
                    : execution.status === "failed" ? "red"
                    : "neutral"
                  }
                >
                  {execution.status}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
