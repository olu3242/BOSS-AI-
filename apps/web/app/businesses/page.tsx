import { apiClient, ApiClientError } from "../../src/lib/apiClient";
import { requireActiveTenant } from "../../src/server/auth";
import BusinessListClient from "./BusinessListClient";

export const metadata = { title: "Businesses" };

export default async function BusinessesPage() {
  const { organization } = await requireActiveTenant("/auth/sign-in");
  const orgId = organization.id;

  let businesses = null;
  let error: string | null = null;

  try {
    businesses = await apiClient.listBusinesses(orgId);
  } catch (err) {
    error = err instanceof ApiClientError ? err.body.message : "Failed to load businesses.";
  }

  return <BusinessListClient orgId={orgId} businesses={businesses} error={error} />;
}
