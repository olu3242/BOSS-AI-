"use client";

import { useState } from "react";
import { apiClient } from "../../../../../src/lib/apiClient";
import { StatTile } from "../../../../../src/components/ui/StatTile";
import { PageHeader } from "../../../../../src/components/ui/PageHeader";
import { Button } from "../../../../../src/components/ui/Button";

type Analytics = {
  revenue: { totalCents: number; paidCents: number; pendingCents: number; overdueCount: number; monthlyTrend: Array<{ month: string; amountCents: number }> };
  jobs: { total: number; completed: number; inProgress: number; completionRate: number; avgDurationMinutes: number | null };
  appointments: { total: number; upcoming: number; noShowRate: number };
  customers: { total: number; newThisMonth: number; withOpenInvoices: number };
  reviews: { averageRating: number; total: number; responseRate: number };
  payments: { totalReceivedCents: number; avgDaysToPay: number | null };
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function pct(rate: number) {
  return `${Math.round(rate * 100)}%`;
}


interface Props {
  orgId: string;
  businessId: string;
  analytics: Analytics | null;
  error: string | null;
}

export function AnalyticsClient({ orgId, businessId, analytics: initialAnalytics, error: initialError }: Props) {
  const [analytics, setAnalytics] = useState<Analytics | null>(initialAnalytics);
  const [error, setError] = useState<string | null>(initialError);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const data = await apiClient.getBusinessAnalytics(orgId, businessId);
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  }

  if (error && !analytics) {
    return (
      <div className="space-y-4">
        <PageHeader title="Analytics" />
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button onClick={handleRefresh} className="mt-4 text-sm text-accent hover:underline">Try again</button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 rounded bg-elevated animate-pulse" />
          <div className="h-8 w-24 rounded bg-elevated animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <StatTile key={i} label="" value="" loading />
          ))}
        </div>
      </div>
    );
  }

  const { revenue, jobs, appointments, customers, reviews, payments } = analytics;

  const maxTrend = Math.max(...revenue.monthlyTrend.map((m) => m.amountCents), 1);

  function monthLabel(key: string) {
    const [year, month] = key.split("-");
    return new Date(parseInt(year ?? "0"), parseInt(month ?? "1") - 1).toLocaleDateString("en-US", { month: "short" });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Business performance dashboard"
        action={
          <Button variant="secondary" onClick={handleRefresh} disabled={refreshing} loading={refreshing}>
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
        }
      />

      {error && (
        <div className="rounded-lg border border-yellow-800 bg-yellow-950/30 p-3 text-sm text-yellow-400">
          {error}
        </div>
      )}

      {/* Row 1 — KPI Tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Total Revenue"
          value={formatMoney(revenue.paidCents)}
          delta="from paid invoices"
          trend="neutral"
        />
        <StatTile
          label="Jobs Completed"
          value={jobs.completed}
          delta={`${pct(jobs.completionRate)} completion rate`}
          trend="neutral"
        />
        <StatTile
          label="Avg Rating"
          value={reviews.total > 0 ? `${reviews.averageRating.toFixed(1)} ★` : "—"}
          delta={`${reviews.total} review${reviews.total !== 1 ? "s" : ""}`}
          trend={reviews.total > 0 ? "up" : "neutral"}
        />
        <StatTile
          label="Active Customers"
          value={customers.total}
          delta={`+${customers.newThisMonth} this month`}
          trend={customers.newThisMonth > 0 ? "up" : "neutral"}
        />
      </div>

      {/* Row 2 — Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-3">
          <p className="text-sm font-medium text-neutral-300">Revenue Breakdown</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-400">Paid</span>
              <span className="font-semibold text-neutral-100">{formatMoney(revenue.paidCents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-400">Pending</span>
              <span className="font-semibold text-neutral-100">{formatMoney(revenue.pendingCents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-400">Overdue ({revenue.overdueCount})</span>
              <span className="font-semibold text-red-400">{revenue.overdueCount > 0 ? "!" : "—"}</span>
            </div>
            <div className="border-t border-neutral-800 pt-2 flex items-center justify-between">
              <span className="text-sm text-neutral-500">Avg days to pay</span>
              <span className="text-neutral-300">{payments.avgDaysToPay !== null ? `${payments.avgDaysToPay}d` : "—"}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-3">
          <p className="text-sm font-medium text-neutral-300">Jobs Breakdown</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-400">Completed</span>
              <span className="font-semibold text-neutral-100">{jobs.completed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-400">In Progress</span>
              <span className="font-semibold text-neutral-100">{jobs.inProgress}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Total</span>
              <span className="font-semibold text-neutral-100">{jobs.total}</span>
            </div>
            <div className="border-t border-neutral-800 pt-2 flex items-center justify-between">
              <span className="text-sm text-neutral-500">Avg duration</span>
              <span className="text-neutral-300">{jobs.avgDurationMinutes !== null ? `${jobs.avgDurationMinutes}m` : "—"}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-3">
          <p className="text-sm font-medium text-neutral-300">Appointments</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-400">Upcoming</span>
              <span className="font-semibold text-neutral-100">{appointments.upcoming}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Total</span>
              <span className="font-semibold text-neutral-100">{appointments.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-400">No-show rate</span>
              <span className="font-semibold text-neutral-100">{pct(appointments.noShowRate)}</span>
            </div>
            <div className="border-t border-neutral-800 pt-2 flex items-center justify-between">
              <span className="text-sm text-neutral-500">Open invoices</span>
              <span className="text-neutral-300">{customers.withOpenInvoices} customers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 — Monthly Revenue Trend */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
        <p className="text-sm font-medium text-neutral-300 mb-4">Monthly Revenue Trend (last 6 months)</p>
        <div className="flex items-end gap-2 h-32">
          {revenue.monthlyTrend.map((m) => {
            const heightPct = maxTrend > 0 ? (m.amountCents / maxTrend) * 100 : 0;
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-neutral-500">{formatMoney(m.amountCents)}</span>
                <div className="w-full flex items-end" style={{ height: "80px" }}>
                  <div
                    className="w-full rounded-t bg-accent/70 hover:bg-accent transition-colors"
                    style={{ height: `${Math.max(heightPct, m.amountCents > 0 ? 4 : 0)}%` }}
                    title={`${m.month}: ${formatMoney(m.amountCents)}`}
                  />
                </div>
                <span className="text-xs text-neutral-500">{monthLabel(m.month)}</span>
              </div>
            );
          })}
        </div>
        {revenue.monthlyTrend.every((m) => m.amountCents === 0) && (
          <p className="text-center text-sm text-neutral-500 mt-2">No paid invoices in the last 6 months</p>
        )}
      </div>

      {/* Row 4 — Reviews & Payments Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Average Rating"
          value={reviews.total > 0 ? `${reviews.averageRating.toFixed(1)} ★` : "—"}
          trend={reviews.total > 0 ? "up" : "neutral"}
        />
        <StatTile
          label="Total Reviews"
          value={reviews.total}
          delta={`${pct(reviews.responseRate)} response rate`}
          trend="neutral"
        />
        <StatTile
          label="Response Rate"
          value={pct(reviews.responseRate)}
          trend={reviews.responseRate >= 0.8 ? "up" : reviews.responseRate > 0 ? "neutral" : "down"}
        />
        <StatTile
          label="Payments Received"
          value={formatMoney(payments.totalReceivedCents)}
          trend="up"
        />
      </div>
    </div>
  );
}
