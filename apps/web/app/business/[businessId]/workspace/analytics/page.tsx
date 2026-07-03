import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";
import { AnalyticsClient } from "./AnalyticsClient";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function AnalyticsPage({ params }: Props) {
  const { businessId } = await params;
  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;

  let analytics: Awaited<ReturnType<typeof apiClient.getBusinessAnalytics>> | null = null;
  let error: string | null = null;

  try {
    analytics = await apiClient.getBusinessAnalytics(orgId, businessId);
  } catch (err) {
    error = err instanceof ApiClientError ? err.body.message : "Failed to load analytics";
  }

  return <AnalyticsClient orgId={orgId} businessId={businessId} analytics={analytics} error={error} />;
}
