import { apiClient, ApiClientError } from "../../src/lib/apiClient";
import { requireActiveTenant } from "../../src/server/auth";
import DashboardClient from "./DashboardClient";

export const metadata = { title: "Executive Dashboard" };

function isNextInternalError(err: unknown): boolean {
  // Next.js throws special errors for redirect() and notFound() that must not be caught.
  const digest = (err as { digest?: string })?.digest ?? "";
  return digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND";
}

export default async function DashboardPage() {
  let orgId: string;
  let sessionToken: string;
  try {
    const { organization, accessToken } = await requireActiveTenant("/dashboard");
    orgId = organization.id;
    sessionToken = accessToken;
  } catch (err) {
    if (isNextInternalError(err)) throw err;
    console.error("[dashboard] requireActiveTenant failed:", err instanceof Error ? err.message : err);
    return (
      <DashboardClient
        orgId=""
        data={null}
        error="Unable to load your organization. Check that DATABASE_URL is configured and the database is reachable."
      />
    );
  }

  let data = null;
  let error: string | null = null;

  try {
    data = await apiClient.getOrgDashboard(orgId, sessionToken);
  } catch (err) {
    error = err instanceof ApiClientError ? err.body.message : "Failed to load dashboard.";
  }

  return <DashboardClient orgId={orgId} data={data} error={error} />;
}
