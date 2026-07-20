import { apiClient } from "../../src/lib/apiClient";
import { requireActiveTenant } from "../../src/server/auth";
import DashboardClient from "./DashboardClient";

export const metadata = { title: "Executive Dashboard" };
export const dynamic = "force-dynamic";

function isNextInternalError(err: unknown): boolean {
  const digest = (err as { digest?: string })?.digest ?? "";
  return (
    digest.startsWith("NEXT_REDIRECT") ||
    digest === "NEXT_NOT_FOUND" ||
    digest === "DYNAMIC_SERVER_USAGE"
  );
}

function elapsed(start: number): string {
  return `${Date.now() - start}ms`;
}

export default async function DashboardPage() {
  const traceId = crypto.randomUUID();
  const t0 = Date.now();
  console.log(`[dashboard/page] start trace=${traceId}`);

  // ── Stage 1: Tenant resolution ────────────────────────────────────────────
  const t1 = Date.now();
  console.log(`[dashboard/page] tenant_lookup_start trace=${traceId}`);
  let tenant: Awaited<ReturnType<typeof requireActiveTenant>>;
  try {
    tenant = await requireActiveTenant("/dashboard");
  } catch (err) {
    if (isNextInternalError(err)) throw err;
    console.error(`[dashboard/page] tenant_lookup_fail trace=${traceId} latency=${elapsed(t1)}`, {
      message: err instanceof Error ? err.message : String(err),
      digest: (err as { digest?: string })?.digest,
      stack: err instanceof Error ? err.stack : undefined,
    });
    throw err;
  }
  const orgId = tenant.organization.id;
  console.log(
    `[dashboard/page] tenant_lookup_ok trace=${traceId} orgId=${orgId.slice(0, 8)}... latency=${elapsed(t1)}`,
  );

  // ── Stage 2: Dashboard data ───────────────────────────────────────────────
  const t2 = Date.now();
  console.log(`[dashboard/page] api_fetch_start trace=${traceId} orgId=${orgId.slice(0, 8)}...`);
  let data: Awaited<ReturnType<typeof apiClient.getOrgDashboard>>;
  try {
    data = await apiClient.getOrgDashboard(orgId, tenant.accessToken);
    console.log(`[dashboard/page] api_fetch_ok trace=${traceId} latency=${elapsed(t2)}`);
  } catch (err) {
    console.error(`[dashboard/page] api_fetch_fail trace=${traceId} latency=${elapsed(t2)}`, {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    throw err;
  }

  console.log(`[dashboard/page] render trace=${traceId} total=${elapsed(t0)}`);
  return <DashboardClient orgId={orgId} data={data} error={null} />;
}
