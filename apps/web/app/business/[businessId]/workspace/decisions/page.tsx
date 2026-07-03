import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";
import { DecisionsClient } from "./DecisionsClient";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function DecisionsPage({ params }: Props) {
  const { businessId } = await params;
  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;

  let decisions: Awaited<ReturnType<typeof apiClient.getDecisions>> = [];
  let error: string | null = null;

  try {
    decisions = await apiClient.getDecisions(orgId, businessId);
  } catch (err) {
    error = err instanceof ApiClientError ? err.body.message : "Failed to load decisions.";
  }

  return <DecisionsClient orgId={orgId} businessId={businessId} initialDecisions={decisions} initialError={error} />;
}
