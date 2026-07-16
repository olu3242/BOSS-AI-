import { apiClient, ApiClientError } from "../../src/lib/apiClient";
import { requireActiveTenant } from "../../src/server/auth";
import DashboardClient from "./DashboardClient";

export const metadata = { title: "Executive Dashboard" };

function isNextInternalError(err: unknown): boolean {
  const digest = (err as { digest?: string })?.digest ?? "";
  return digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND";
}

function elapsed(start: number): string {
  return `${Date.now() - start}ms`;
}

export default async function DashboardPage() {
  const traceId = crypto.randomUUID();
  const t0 = Date.now();
  console.log(`[dashboard/page] start trace=${traceId}`);

  let orgId: string;
  let sessionToken: string;

  // ── Stage 1: Tenant resolution ────────────────────────────────────────────
  const t1 = Date.now();
  console.log(`[dashboard/page] tenant_lookup_start trace=${traceId}`);
  try {
    const { organization, accessToken } = await requireActiveTenant("/dashboard");
    orgId = organization.id;
    sessionToken = accessToken;
    console.log(
      `[dashboard/page] tenant_lookup_ok trace=${traceId} orgId=${orgId.slice(0, 8)}... latency=${elapsed(t1)}`,
    );
  } catch (err) {
    if (isNextInternalError(err)) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    const digest = (err as { digest?: string })?.digest;
    console.error(`[dashboard/page] tenant_lookup_fail trace=${traceId} latency=${elapsed(t1)}`, {
      message: msg,
      digest,
      stack: err instanceof Error ? err.stack : undefined,
    });
    return (
      <DashboardClient
        orgId=""
        data={null}
        error={`Organization could not load: ${msg}`}
      />
    );
  }

  // ── Stage 2: Dashboard data ───────────────────────────────────────────────
  let data = null;
  let error: string | null = null;
  const t2 = Date.now();
  console.log(`[dashboard/page] api_fetch_start trace=${traceId} orgId=${orgId.slice(0, 8)}...`);
  try {
    data = await apiClient.getOrgDashboard(orgId, sessionToken);
    console.log(`[dashboard/page] api_fetch_ok trace=${traceId} latency=${elapsed(t2)}`);
  } catch (err) {
    const msg = err instanceof ApiClientError
      ? `${err.status} ${err.body.message}`
      : err instanceof Error ? err.message : String(err);
    console.error(`[dashboard/page] api_fetch_fail trace=${traceId} latency=${elapsed(t2)} error=${msg}`);
    error = err instanceof ApiClientError ? err.body.message : "Failed to load dashboard data.";
  }

  console.log(`[dashboard/page] render trace=${traceId} total=${elapsed(t0)} hasData=${data !== null} hasError=${error !== null}`);
  return <DashboardClient orgId={orgId} data={data} error={error} />;
}
