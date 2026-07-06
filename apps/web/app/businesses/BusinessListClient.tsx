"use client";

import Link from "next/link";
import { PageHeader } from "../../src/components/ui/PageHeader";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { Badge } from "../../src/components/ui/Badge";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";

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
        <PageHeader title="Businesses" description="All businesses in your organization." action={<Link href="/business/new"><Button>+ Add Business</Button></Link>} />
        <div className="rounded border border-red-800 bg-red-950/30 p-5 text-red-400">
          <p className="font-medium">Failed to load businesses</p>
          <p className="mt-1 text-sm">{error}</p>
          <Button variant="danger" onClick={() => window.location.reload()} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  if (!businesses) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-48 rounded bg-elevated" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded border border-border bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Businesses"
        description="All businesses in your organization."
        action={<Link href="/business/new"><Button>+ Add Business</Button></Link>}
      />

      {businesses.length === 0 ? (
        <EmptyState
          title="No businesses yet"
          description="Add your first business to start tracking health, KPIs, and AI recommendations."
          action={<Link href="/business/new"><Button>Add Your First Business →</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => {
            const tone = business.health ? healthLabel(business.health.overallScore) : null;
            return (
              <Card key={business.id} hoverable className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-text-primary leading-tight truncate">
                      {business.businessName}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5 capitalize">
                      {business.businessType.replace(/_/g, " ")}
                    </p>
                  </div>
                  {tone && business.health ? (
                    <Badge color={tone.label === "Excellent" ? "green" : tone.label === "Good" ? "blue" : tone.label === "Needs Attention" ? "yellow" : "red"}>
                      {business.health.overallScore} · {tone.label}
                    </Badge>
                  ) : (
                    <Badge color="neutral">No score</Badge>
                  )}
                </div>

                {/* Meta */}
                <div className="flex gap-4 text-xs text-text-muted">
                  <span>{business.employeeCount} employees</span>
                  <span>{business.locationCount} location{business.locationCount !== 1 ? "s" : ""}</span>
                  <span>{business.yearsOperating}yr{business.yearsOperating !== 1 ? "s" : ""}</span>
                </div>

                {/* Quick Links */}
                <div className="flex gap-2 border-t border-border pt-3">
                  <Link
                    href={`/business/${business.id}/health`}
                    className="flex-1 rounded border border-border px-3 py-1.5 text-center text-xs text-text-muted hover:border-border-strong hover:text-text-primary transition-colors"
                  >
                    Health
                  </Link>
                  <Link
                    href={`/business/${business.id}/workspace`}
                    className="flex-1 rounded border border-border px-3 py-1.5 text-center text-xs text-text-muted hover:border-border-strong hover:text-text-primary transition-colors"
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
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

