"use client";

import Link from "next/link";

interface BusinessSummary {
  id: string;
  businessName: string;
  businessType: string;
  employeeCount: number;
  locationCount: number;
  yearsOperating: number;
  health: { overallScore: number; generatedAt: string } | null;
}

interface Props {
  orgId: string;
  businesses: BusinessSummary[] | null;
  error: string | null;
}

function healthLabel(score: number) {
  if (score >= 80) return { label: "Excellent", color: "text-green-400", bg: "bg-green-950/30 border-green-900/50" };
  if (score >= 60) return { label: "Good", color: "text-blue-400", bg: "bg-blue-950/30 border-blue-900/50" };
  if (score >= 40) return { label: "Needs Attention", color: "text-yellow-400", bg: "bg-yellow-950/30 border-yellow-900/50" };
  return { label: "Critical", color: "text-red-400", bg: "bg-red-950/30 border-red-900/50" };
}

export default function BusinessListClient({ orgId: _orgId, businesses, error }: Props) {
  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader />
        <div className="rounded border border-red-800 bg-red-950/30 p-5 text-red-400">
          <p className="font-medium">Failed to load businesses</p>
          <p className="mt-1 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!businesses) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-48 rounded bg-neutral-800" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded border border-neutral-800 bg-neutral-900" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader />

      {businesses.length === 0 ? (
        <div className="rounded border border-neutral-700 bg-neutral-900 p-12 text-center">
          <p className="text-lg font-medium text-neutral-200">No businesses yet</p>
          <p className="mt-2 text-sm text-neutral-400 max-w-sm mx-auto">
            Add your first business to start tracking health, KPIs, and AI recommendations.
          </p>
          <Link
            href="/business/new"
            className="mt-5 inline-flex rounded bg-red-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-colors"
          >
            Add Your First Business →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => {
            const tone = business.health ? healthLabel(business.health.overallScore) : null;
            return (
              <div
                key={business.id}
                className="flex flex-col gap-4 rounded border border-neutral-800 bg-neutral-900 p-5 hover:border-neutral-700 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-neutral-100 leading-tight truncate">
                      {business.businessName}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5 capitalize">
                      {business.businessType.replace(/_/g, " ")}
                    </p>
                  </div>
                  {tone && business.health ? (
                    <div className={`flex-shrink-0 rounded border px-2 py-1 text-center ${tone.bg}`}>
                      <p className={`font-display text-xl font-black leading-none ${tone.color}`}>
                        {business.health.overallScore}
                      </p>
                      <p className={`text-[10px] font-medium leading-tight ${tone.color}`}>{tone.label}</p>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-center">
                      <p className="font-display text-sm font-medium leading-none text-neutral-500">—</p>
                      <p className="text-[10px] text-neutral-600 leading-tight">No score</p>
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="flex gap-4 text-xs text-neutral-500">
                  <span>{business.employeeCount} employees</span>
                  <span>{business.locationCount} location{business.locationCount !== 1 ? "s" : ""}</span>
                  <span>{business.yearsOperating}yr{business.yearsOperating !== 1 ? "s" : ""}</span>
                </div>

                {/* Quick Links */}
                <div className="flex gap-2 border-t border-neutral-800 pt-3">
                  <Link
                    href={`/business/${business.id}/health`}
                    className="flex-1 rounded border border-neutral-700 px-3 py-1.5 text-center text-xs text-neutral-400 hover:border-neutral-600 hover:text-white transition-colors"
                  >
                    Health
                  </Link>
                  <Link
                    href={`/business/${business.id}/workspace`}
                    className="flex-1 rounded border border-neutral-700 px-3 py-1.5 text-center text-xs text-neutral-400 hover:border-neutral-600 hover:text-white transition-colors"
                  >
                    Workspace
                  </Link>
                  <Link
                    href={`/business/${business.id}/workspace`}
                    className="flex-1 rounded bg-red-700/20 border border-red-800/50 px-3 py-1.5 text-center text-xs text-red-400 hover:bg-red-700/40 transition-colors"
                  >
                    Mission Control
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PageHeader() {
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Organization</p>
        <h1 className="mt-1 font-display text-3xl">Businesses</h1>
        <p className="mt-2 text-sm text-neutral-400">All businesses in your organization.</p>
      </div>
      <Link
        href="/business/new"
        className="shrink-0 rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
      >
        + Add Business
      </Link>
    </div>
  );
}
