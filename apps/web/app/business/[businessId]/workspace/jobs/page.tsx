import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";
import { JobsClient } from "./JobsClient";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function JobsPage({ params }: Props) {
  const { businessId } = await params;
  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;

  let jobs: Awaited<ReturnType<typeof apiClient.listJobs>> = [];
  let error: string | null = null;

  try {
    jobs = await apiClient.listJobs(orgId, businessId);
  } catch (err) {
    error = err instanceof ApiClientError ? err.body.message : "Failed to load jobs";
  }

  return <JobsClient orgId={orgId} businessId={businessId} jobs={jobs} error={error} />;
}
