import Link from "next/link";
import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";
import { EmptyState } from "../../../../../src/components/ui/EmptyState";
import { Input } from "../../../../../src/components/ui/Input";
import { PageHeader } from "../../../../../src/components/ui/PageHeader";
import { StatTile } from "../../../../../src/components/ui/StatTile";
import { Button } from "../../../../../src/components/ui/Button";
import { Badge } from "../../../../../src/components/ui/Badge";
import { Card } from "../../../../../src/components/ui/Card";

interface Props {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ q?: string }>;
}

function customerStatusColor(status: string): "yellow" | "green" | "red" | "neutral" {
  if (status === "prospect") return "yellow";
  if (status === "active" || status === "vip") return "green";
  if (status === "churned") return "red";
  return "neutral";
}

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

      <PageHeader
        title="Customers"
        description={`${customers.length} total · ${activeCount} active · ${vipCount} VIP`}
        action={
          <Link href={`${base}/customers/new`} className="rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors">
            + Add customer
          </Link>
        }
      />

      {/* ── Stats strip ───────────────────────────────────── */}
      {customers.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <StatTile label="Total customers" value={customers.length} />
          <StatTile label="Active / VIP" value={activeCount} />
          <StatTile label="Total revenue" value={revenueLabel(totalRevenue)} />
        </div>
      )}

      {/* ── Search ────────────────────────────────────────── */}
      <form method="GET" className="flex gap-2">
        <div className="flex-1">
          <Input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name, email, or phone…"
          />
        </div>
        <Button type="submit" variant="secondary">Search</Button>
        {q && (
          <Link
            href={`${base}/customers`}
            className="rounded border border-border bg-elevated px-4 py-2 text-sm text-text-muted hover:bg-border transition-colors"
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
        <EmptyState
          title="No customers yet"
          description="Start adding customers to track relationships, revenue, and communication history."
          action={
            <Link
              href={`${base}/customers/new`}
              className="rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            >
              Add your first customer
            </Link>
          }
        />
      )}

      {!error && customers.length === 0 && q && (
        <EmptyState
          title={`No customers match "${q}"`}
          dashed={false}
        />
      )}

      {/* ── Customer list ─────────────────────────────────── */}
      {customers.length > 0 && (
        <Card className="flex flex-col divide-y divide-border overflow-hidden">
          {customers.map((c) => (
            <Link
              key={c.id}
              href={`${base}/customers/${c.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-elevated/60 transition-colors"
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-elevated font-display text-sm font-bold text-text-secondary">
                {initials(c.firstName, c.lastName)}
              </div>

              {/* Name + contact */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary truncate">
                  {c.firstName} {c.lastName}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {c.email ?? c.phone ?? "No contact info"}
                </p>
              </div>

              {/* Tags */}
              {c.tags.length > 0 && (
                <div className="hidden sm:flex gap-1">
                  {c.tags.slice(0, 2).map((t) => (
                    <Badge key={t} color="neutral">{t}</Badge>
                  ))}
                </div>
              )}

              {/* Revenue */}
              <div className="hidden md:block w-20 text-right">
                <p className="text-sm text-text-secondary">{revenueLabel(c.totalRevenue)}</p>
                <p className="text-[11px] text-text-muted">revenue</p>
              </div>

              {/* Status */}
              <Badge color={customerStatusColor(c.status)}>{c.status}</Badge>

              <span className="shrink-0 text-text-muted">→</span>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
