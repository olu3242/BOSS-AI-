import { apiClient } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";
import { PageHeader } from "../../../../../src/components/ui/PageHeader";
import { Card } from "../../../../../src/components/ui/Card";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const { businessId } = await params;
  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;
  let business: Awaited<ReturnType<typeof apiClient.getBusiness>> | null = null;
  try {
    business = await apiClient.getBusiness(orgId, businessId);
  } catch {
    business = null;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Settings & Governance" description="Business profile and data governance for this workspace." />

      <section>
        <h2 className="mb-3 font-display text-lg text-text-secondary">Business Profile</h2>
        <Card padding="md">
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-text-muted">Business ID</dt>
              <dd className="mt-1 font-mono text-sm text-text-secondary">{businessId}</dd>
            </div>
            {business && (
              <>
                <div>
                  <dt className="text-xs text-text-muted">Name</dt>
                  <dd className="mt-1 text-sm text-text-secondary">{business.businessName}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Type</dt>
                  <dd className="mt-1 text-sm text-text-secondary">{business.businessType}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Employees</dt>
                  <dd className="mt-1 text-sm text-text-secondary">{business.employeeCount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Years Operating</dt>
                  <dd className="mt-1 text-sm text-text-secondary">{business.yearsOperating}</dd>
                </div>
              </>
            )}
          </dl>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg text-text-secondary">Data & Privacy</h2>
        <div className="flex flex-col gap-3">
          <Card padding="sm">
            <p className="font-medium text-sm text-text-primary">Event Log</p>
            <p className="mt-1 text-xs text-text-muted">
              All business events are recorded in an immutable audit log. No events are deleted.
            </p>
          </Card>
          <Card padding="sm">
            <p className="font-medium text-sm text-text-primary">Multi-Tenant Isolation</p>
            <p className="mt-1 text-xs text-text-muted">
              All data is scoped to your organization. No data is shared across organizations.
            </p>
          </Card>
          <Card padding="sm">
            <p className="font-medium text-sm text-text-primary">Organizational Memory</p>
            <p className="mt-1 text-xs text-text-muted">
              BOSS retains learnings from every verified decision outcome to improve future recommendations.
            </p>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg text-text-secondary">Workspace Navigation</h2>
        <Card padding="sm">
          <ul className="flex flex-col gap-2 text-sm">
            <li className="text-text-secondary"><strong>Overview</strong> — Health score, KPIs, loop status, decision pipeline</li>
            <li className="text-text-secondary"><strong>Timeline</strong> — Chronological business event feed</li>
            <li className="text-text-secondary"><strong>Approvals</strong> — Pending decisions and recommendations</li>
            <li className="text-text-secondary"><strong>Automation</strong> — Integrations and tool execution history</li>
            <li className="text-text-secondary"><strong>Intelligence</strong> — KPI readings, signals, decision pipeline</li>
            <li className="text-text-secondary"><strong>Settings</strong> — Business profile and governance (this page)</li>
          </ul>
        </Card>
      </section>
    </div>
  );
}
