import { apiClient } from "../../../../../src/lib/apiClient";
import { DEMO_ORG_ID } from "../../../../../src/lib/demoOrg";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const { businessId } = await params;
  let business: Awaited<ReturnType<typeof apiClient.getBusiness>> | null = null;
  try {
    business = await apiClient.getBusiness(DEMO_ORG_ID, businessId);
  } catch {
    business = null;
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl">Settings & Governance</h1>

      <section>
        <h2 className="mb-3 font-display text-lg text-neutral-300">Business Profile</h2>
        <div className="rounded border border-neutral-800 bg-neutral-900 p-5">
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-neutral-500">Business ID</dt>
              <dd className="mt-1 font-mono text-sm text-neutral-300">{businessId}</dd>
            </div>
            {business && (
              <>
                <div>
                  <dt className="text-xs text-neutral-500">Name</dt>
                  <dd className="mt-1 text-sm text-neutral-300">{business.businessName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Type</dt>
                  <dd className="mt-1 text-sm text-neutral-300">{business.businessType}</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Employees</dt>
                  <dd className="mt-1 text-sm text-neutral-300">{business.employeeCount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500">Years Operating</dt>
                  <dd className="mt-1 text-sm text-neutral-300">{business.yearsOperating}</dd>
                </div>
              </>
            )}
          </dl>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg text-neutral-300">Data & Privacy</h2>
        <div className="flex flex-col gap-3">
          <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
            <p className="font-medium text-sm">Event Log</p>
            <p className="mt-1 text-xs text-neutral-400">
              All business events are recorded in an immutable audit log. No events are deleted.
            </p>
          </div>
          <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
            <p className="font-medium text-sm">Multi-Tenant Isolation</p>
            <p className="mt-1 text-xs text-neutral-400">
              All data is scoped to your organization. No data is shared across organizations.
            </p>
          </div>
          <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
            <p className="font-medium text-sm">Organizational Memory</p>
            <p className="mt-1 text-xs text-neutral-400">
              BOSS retains learnings from every verified decision outcome to improve future recommendations.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg text-neutral-300">Workspace Navigation</h2>
        <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
          <ul className="flex flex-col gap-2 text-sm">
            <li className="text-neutral-300">
              <strong>Overview</strong> — Health score, KPIs, loop status, decision pipeline
            </li>
            <li className="text-neutral-300">
              <strong>Timeline</strong> — Chronological business event feed
            </li>
            <li className="text-neutral-300">
              <strong>Approvals</strong> — Pending decisions and recommendations
            </li>
            <li className="text-neutral-300">
              <strong>Automation</strong> — Integrations and tool execution history
            </li>
            <li className="text-neutral-300">
              <strong>Intelligence</strong> — KPI readings, signals, decision pipeline
            </li>
            <li className="text-neutral-300">
              <strong>Settings</strong> — Business profile and governance (this page)
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
