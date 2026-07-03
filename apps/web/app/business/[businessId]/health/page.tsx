import { apiClient, ApiClientError } from "../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../src/server/auth";
import HealthClient from "./HealthClient";

interface Props {
  params: Promise<{ businessId: string }>;
}

export const metadata = { title: "Business Health" };

export default async function HealthPage({ params }: Props) {
  const { businessId } = await params;
  const { organization } = await requireActiveTenant("/auth/sign-in");
  const orgId = organization.id;

  const [businessResult, workspaceResult, constraintsResult, recommendationsResult, healthHistoryResult, kpisResult] =
    await Promise.allSettled([
      apiClient.getBusiness(orgId, businessId),
      apiClient.getWorkspace(orgId, businessId),
      apiClient.getConstraints(orgId, businessId),
      apiClient.listRecommendations(orgId, businessId),
      apiClient.getHealthHistory(orgId, businessId),
      apiClient.getKpis(orgId, businessId),
    ]);

  const businessName =
    businessResult.status === "fulfilled"
      ? businessResult.value.businessName
      : "Business";

  if (workspaceResult.status === "rejected") {
    const err = workspaceResult.reason;
    const error =
      err instanceof ApiClientError ? err.body.message : "Failed to load health data.";
    return (
      <HealthClient
        orgId={orgId}
        businessId={businessId}
        businessName={businessName}
        health={null}
        healthHistory={[]}
        constraints={[]}
        topRecommendation={null}
        kpis={[]}
        error={error}
      />
    );
  }

  const workspace = workspaceResult.value;
  const constraints =
    constraintsResult.status === "fulfilled" ? constraintsResult.value : [];
  const recommendations =
    recommendationsResult.status === "fulfilled" ? recommendationsResult.value : [];
  const healthHistory =
    healthHistoryResult.status === "fulfilled" ? healthHistoryResult.value : [];
  const kpis =
    kpisResult.status === "fulfilled" ? kpisResult.value.readings : [];

  const topRecommendation =
    recommendations.find((r) => r.status === "proposed") ?? null;

  return (
    <HealthClient
      orgId={orgId}
      businessId={businessId}
      businessName={businessName}
      health={workspace.health}
      healthHistory={healthHistory}
      constraints={constraints}
      topRecommendation={topRecommendation}
      kpis={kpis}
      error={null}
    />
  );
}
