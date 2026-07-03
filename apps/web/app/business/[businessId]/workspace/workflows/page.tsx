import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";
import { WorkflowsClient } from "./WorkflowsClient";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function WorkflowsPage({ params }: Props) {
  const { businessId } = await params;
  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;

  let executions: Awaited<ReturnType<typeof apiClient.listWorkflowExecutions>> = [];
  let error: string | null = null;

  try {
    executions = await apiClient.listWorkflowExecutions(orgId, businessId);
  } catch (err) {
    error = err instanceof ApiClientError ? err.body.message : "Failed to load workflows.";
  }

  return <WorkflowsClient orgId={orgId} businessId={businessId} initialExecutions={executions} initialError={error} />;
}
