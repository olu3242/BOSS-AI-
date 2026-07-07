import Link from "next/link";
import { apiClient } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";

import { PageHeader } from "../../../../../src/components/ui/PageHeader";
import { Card } from "../../../../../src/components/ui/Card";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function WorkPage({ params }: Props) {
  const { businessId } = await params;
  const base = `/business/${businessId}/workspace`;
  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;

  let analytics: Awaited<ReturnType<typeof apiClient.getBusinessAnalytics>> | null = null;
  try {
    analytics = await apiClient.getBusinessAnalytics(orgId, businessId);
  } catch (err) {
    void err;
  }

  const jobs = analytics?.jobs;
  const appointments = analytics?.appointments;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Work" description="Jobs, appointments, scheduling, and service delivery." />

      {/* ── Stats strip ─────────────────────────────────── */}
      {analytics && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total jobs",       value: jobs?.total ?? 0 },
            { label: "In progress",      value: jobs?.inProgress ?? 0 },
            { label: "Completed",        value: jobs?.completed ?? 0 },
            { label: "Upcoming appts",   value: appointments?.upcoming ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="rounded border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">{stat.label}</p>
              <p className="mt-1 font-display text-2xl">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Module tiles ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href={`${base}/jobs`}
          className="group rounded border border-neutral-800 bg-neutral-900 p-5 hover:border-neutral-600 transition-colors"
        >
          <span className="text-2xl">🔧</span>
          <p className="mt-3 font-medium text-neutral-200 group-hover:text-white transition-colors">Jobs</p>
          <p className="mt-1 text-sm text-neutral-500">Track active and completed jobs</p>
          {jobs && (
            <p className="mt-3 text-xs text-neutral-600">
              {jobs.inProgress} in progress · {jobs.completed} completed
            </p>
          )}
          <p className="mt-2 text-xs text-accent font-medium">Open →</p>
        </Link>

        <Link
          href={`${base}/appointments`}
          className="group rounded border border-neutral-800 bg-neutral-900 p-5 hover:border-neutral-600 transition-colors"
        >
          <span className="text-2xl">📅</span>
          <p className="mt-3 font-medium text-neutral-200 group-hover:text-white transition-colors">Appointments</p>
          <p className="mt-1 text-sm text-neutral-500">Schedule and manage bookings</p>
          {appointments && (
            <p className="mt-3 text-xs text-neutral-600">
              {appointments.upcoming} upcoming · {appointments.total} total
            </p>
          )}
          <p className="mt-2 text-xs text-accent font-medium">Open →</p>
        </Link>

        <div className="rounded border border-neutral-800 bg-neutral-900/50 p-5">
          <span className="text-2xl opacity-40">🗺️</span>
          <p className="mt-3 font-medium text-neutral-500">Route Planning</p>
          <p className="mt-1 text-sm text-neutral-600">Optimize your daily routes</p>
          <p className="mt-4 text-xs text-neutral-700 uppercase tracking-wide">Coming in RC2.1</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Jobs", desc: "Track active and completed jobs", icon: "🔧" },
          { label: "Appointments", desc: "Schedule and manage bookings", icon: "📅" },
          { label: "Route Planning", desc: "Optimize your daily routes", icon: "🗺️" },
        ].map((tile) => (
          <Card key={tile.label}>
            <span className="text-2xl">{tile.icon}</span>
            <p className="mt-3 font-medium text-text-primary">{tile.label}</p>
            <p className="mt-1 text-sm text-text-muted">{tile.desc}</p>
            <p className="mt-4 text-xs text-text-muted/60 uppercase tracking-wide">Coming in RC2.1</p>
          </Card>
        ))}
      </div>

      <Card padding="lg" className="text-center">
        <p className="text-sm text-text-muted">Scheduling OS is part of the RC2.1 Business Operating Capabilities rollout.</p>
        <Link href={base} className="mt-3 inline-flex text-sm text-text-secondary hover:text-text-primary transition-colors">
          ← Back to Command Center
        </Link>
      </Card>
    </div>
  );
}
