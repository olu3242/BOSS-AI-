import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";
import { ScenariosClient } from "./ScenariosClient";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function ScenariosPage({ params }: Props) {
  const { businessId } = await params;
  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;

  let scenarios: Awaited<ReturnType<typeof apiClient.listScenarios>> = [];
  let error: string | null = null;

  try {
    scenarios = await apiClient.listScenarios(orgId, businessId);
  } catch (err) {
    error = err instanceof ApiClientError ? err.body.message : "Failed to load scenarios.";
  }

  return <ScenariosClient orgId={orgId} businessId={businessId} initialScenarios={scenarios} initialError={error} />;
}
