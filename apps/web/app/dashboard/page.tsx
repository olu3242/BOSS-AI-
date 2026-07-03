import { apiClient, ApiClientError } from "../../src/lib/apiClient";
import { requireActiveTenant } from "../../src/server/auth";
import DashboardClient from "./DashboardClient";

export const metadata = { title: "Executive Dashboard" };

export default async function DashboardPage() {
  const { organization } = await requireActiveTenant("/dashboard");
  const orgId = organization.id;

  let data = null;
  let error: string | null = null;

  try {
    data = await apiClient.getOrgDashboard(orgId);
  } catch (err) {
    error = err instanceof ApiClientError ? err.body.message : "Failed to load dashboard.";
  }

  return <DashboardClient orgId={orgId} data={data} error={error} />;
}
