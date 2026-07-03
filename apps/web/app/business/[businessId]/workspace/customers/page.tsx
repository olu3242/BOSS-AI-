import Link from "next/link";
import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";

interface Props {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ q?: string }>;
}

const STATUS_STYLE: Record<string, string> = {
  prospect:  "bg-yellow-900/40 text-yellow-400",
  active:    "bg-green-900/40 text-green-400",
  inactive:  "bg-neutral-800 text-neutral-500",
  vip:       "bg-purple-900/40 text-purple-300",
  churned:   "bg-red-900/40 text-red-400",
};

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function revenueLabel(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return n > 0 ? `$${n.toLocaleString()}` : "—";
}

export default async function CustomersPage({ params, searchParams }: Props) {
  const { businessId } = await params;
  const { q } = await searchParams;
  const base = `/business/${businessId}/workspace`;

  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;

  let customers: Awaited<ReturnType<typeof apiClient.listCustomers>> = [];
  let error: string | null = null;

  try {
    customers = await apiClient.listCustomers(orgId, businessId, q);
  } catch (err) {
    error = err instanceof ApiClientError ? err.body.message : "Failed to load customers";
  }

  const totalRevenue = customers.reduce((s, c) => s + (c.totalRevenue ?? 0), 0);
  const activeCount  = customers.filter((c) => c.status === "active" || c.status === "vip").length;
  const vipCount     = customers.filter((c) => c.status === "vip").length;

  return (
    <div className="flex flex-col gap-8">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Customers</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {customers.length} total · {activeCount} active · {vipCount} VIP
          </p>
        </div>
        <Link
          href={`${base}/customers/new`}
          className="shrink-0 rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
        >
          + Add customer
        </Link>
      </div>

      {/* ── Stats strip ───────────────────────────────────── */}
      {customers.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total customers", value: customers.length.toString() },
            { label: "Active / VIP", value: `${activeCount}` },
            { label: "Total revenue", value: revenueLabel(totalRevenue) },
          ].map((stat) => (
            <div key={stat.label} className="rounded border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">{stat.label}</p>
              <p className="mt-1 font-display text-2xl">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Search ────────────────────────────────────────── */}
      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name, email, or phone…"
          className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700 transition-colors"
        >
          Search
        </button>
        {q && (
          <Link
            href={`${base}/customers`}
            className="rounded border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-700 transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      {/* ── Error ─────────────────────────────────────────── */}
      {error && (
        <div className="rounded border border-red-800 bg-red-950/30 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────── */}
      {!error && customers.length === 0 && !q && (
        <div className="rounded border border-neutral-800 bg-neutral-900 p-12 text-center">
          <p className="font-display text-lg text-neutral-300">No customers yet</p>
          <p className="mt-2 text-sm text-neutral-500">
            Start adding customers to track relationships, revenue, and communication history.
          </p>
          <Link
            href={`${base}/customers/new`}
            className="mt-4 inline-flex rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
          >
            Add your first customer
          </Link>
        </div>
      )}

      {!error && customers.length === 0 && q && (
        <div className="rounded border border-neutral-800 bg-neutral-900 p-8 text-center text-sm text-neutral-500">
          No customers match &ldquo;{q}&rdquo;
        </div>
      )}

      {/* ── Customer list ─────────────────────────────────── */}
      {customers.length > 0 && (
        <div className="flex flex-col divide-y divide-neutral-800 rounded border border-neutral-800">
          {customers.map((c) => (
            <Link
              key={c.id}
              href={`${base}/customers/${c.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-900/60 transition-colors"
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-800 font-display text-sm font-bold text-neutral-300">
                {initials(c.firstName, c.lastName)}
              </div>

              {/* Name + contact */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">
                  {c.firstName} {c.lastName}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {c.email ?? c.phone ?? "No contact info"}
                </p>
              </div>

              {/* Tags */}
              {c.tags.length > 0 && (
                <div className="hidden sm:flex gap-1">
                  {c.tags.slice(0, 2).map((t) => (
                    <span key={t} className="rounded bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-500">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Revenue */}
              <div className="hidden md:block w-20 text-right">
                <p className="text-sm text-neutral-300">{revenueLabel(c.totalRevenue)}</p>
                <p className="text-[11px] text-neutral-600">revenue</p>
              </div>

              {/* Status */}
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[c.status] ?? "bg-neutral-800 text-neutral-400"}`}>
                {c.status}
              </span>

              <span className="shrink-0 text-neutral-600">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
