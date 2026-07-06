import Link from "next/link";
import { apiClient } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";

import { PageHeader } from "../../../../../src/components/ui/PageHeader";
import { Card } from "../../../../../src/components/ui/Card";

interface Props {
  params: Promise<{ businessId: string }>;
}

function currency(cents: number) {
  const n = cents / 100;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default async function MoneyPage({ params }: Props) {
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

  const revenue = analytics?.revenue;
  const payments = analytics?.payments;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Business Domain</p>
        <h1 className="mt-1 font-display text-3xl">Money</h1>
        <p className="mt-2 text-sm text-neutral-400">Invoices, payments, and cash flow visibility.</p>
      </div>

      <PageHeader title="Money" description="Estimates, invoices, payments, and cash flow." />

      {/* ── Stats strip ─────────────────────────────────── */}
      {analytics && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total invoiced",   value: revenue ? currency(revenue.totalCents) : "—" },
            { label: "Collected",        value: revenue ? currency(revenue.paidCents) : "—" },
            { label: "Pending",          value: revenue ? currency(revenue.pendingCents) : "—" },
            { label: "Overdue",          value: revenue ? String(revenue.overdueCount) : "—" },
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
          href={`${base}/invoices`}
          className="group rounded border border-neutral-800 bg-neutral-900 p-5 hover:border-neutral-600 transition-colors"
        >
          <span className="text-2xl">🧾</span>
          <p className="mt-3 font-medium text-neutral-200 group-hover:text-white transition-colors">Invoices</p>
          <p className="mt-1 text-sm text-neutral-500">Create and track invoices</p>
          {revenue && (
            <p className="mt-3 text-xs text-neutral-600">
              {currency(revenue.paidCents)} collected · {revenue.overdueCount} overdue
            </p>
          )}
          <p className="mt-2 text-xs text-accent font-medium">Open →</p>
        </Link>

        <Link
          href={`${base}/payments`}
          className="group rounded border border-neutral-800 bg-neutral-900 p-5 hover:border-neutral-600 transition-colors"
        >
          <span className="text-2xl">💳</span>
          <p className="mt-3 font-medium text-neutral-200 group-hover:text-white transition-colors">Payments</p>
          <p className="mt-1 text-sm text-neutral-500">Track received payments</p>
          {payments && (
            <p className="mt-3 text-xs text-neutral-600">
              {currency(payments.totalReceivedCents)} received
              {payments.avgDaysToPay !== null ? ` · avg ${payments.avgDaysToPay}d to pay` : ""}
            </p>
          )}
          <p className="mt-2 text-xs text-accent font-medium">Open →</p>
        </Link>

        <div className="rounded border border-neutral-800 bg-neutral-900/50 p-5">
          <span className="text-2xl opacity-40">📊</span>
          <p className="mt-3 font-medium text-neutral-500">Cash Flow</p>
          <p className="mt-1 text-sm text-neutral-600">Understand your financial health</p>
          <p className="mt-4 text-xs text-neutral-700 uppercase tracking-wide">Coming in RC2.1</p>
        </div>
      </div>

      {/* ── Monthly revenue trend ──────────────────────── */}
      {revenue && revenue.monthlyTrend.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg text-neutral-300">Monthly Revenue</h2>
          <div className="rounded border border-neutral-800 bg-neutral-900 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-neutral-500">Month</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wide text-neutral-500">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {revenue.monthlyTrend.map((row) => (
                  <tr key={row.month} className="border-b border-neutral-800/50 last:border-0">
                    <td className="px-4 py-3 text-neutral-300">{row.month}</td>
                    <td className="px-4 py-3 text-right text-neutral-200 font-mono">{currency(row.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

        {[
          { label: "Invoices",   desc: "Create and track invoices",        icon: "🧾" },
          { label: "Estimates",  desc: "Send quotes and win more jobs",     icon: "💰" },
          { label: "Cash Flow",  desc: "Understand your financial health",  icon: "📊" },
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
        <p className="text-sm text-text-muted">Revenue OS is part of the RC2.1 Business Operating Capabilities rollout.</p>
        <Link href={base} className="mt-3 inline-flex text-sm text-text-secondary hover:text-text-primary transition-colors">
          ← Back to Command Center
        </Link>
      </Card>
    </div>
  );
}
