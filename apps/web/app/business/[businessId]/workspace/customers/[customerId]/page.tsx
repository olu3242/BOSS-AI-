import Link from "next/link";
import { apiClient, ApiClientError } from "../../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../../src/server/auth";
import { AddInteractionForm } from "./AddInteractionForm";
import { EmptyState } from "../../../../../../src/components/ui/EmptyState";
import { PageHeader } from "../../../../../../src/components/ui/PageHeader";
import { StatTile } from "../../../../../../src/components/ui/StatTile";
import { Card } from "../../../../../../src/components/ui/Card";
import { Badge } from "../../../../../../src/components/ui/Badge";

interface Props {
  params: Promise<{ businessId: string; customerId: string }>;
}

function statusBadgeColor(status: string): "green" | "yellow" | "blue" | "red" | "neutral" {
  if (status === "active") return "green";
  if (status === "vip") return "yellow";
  if (status === "prospect") return "blue";
  if (status === "churned") return "red";
  return "neutral";
}

const INTERACTION_ICON: Record<string, string> = {
  call: "📞", email: "📧", sms: "💬", appointment: "📅",
  invoice: "🧾", quote: "💰", note: "📝", review: "⭐", in_person: "🤝",
};

function timeAgo(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function revenueLabel(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return n > 0 ? `$${n.toLocaleString()}` : "$0";
}

export default async function CustomerProfilePage({ params }: Props) {
  const { businessId, customerId } = await params;
  const base = `/business/${businessId}/workspace`;

  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;

  const [customerResult, interactionsResult] = await Promise.allSettled([
    apiClient.getCustomer(orgId, businessId, customerId),
    apiClient.listCustomerInteractions(orgId, businessId, customerId),
  ]);

  if (customerResult.status === "rejected") {
    const msg = customerResult.reason instanceof ApiClientError
      ? customerResult.reason.body.message
      : "Customer not found";
    return (
      <div className="flex flex-col gap-4">
        <Link href={`${base}/customers`} className="text-sm text-text-muted hover:text-text-secondary">
          ← Customers
        </Link>
        <div className="rounded border border-red-800 bg-red-950/30 p-4 text-sm text-red-400">{msg}</div>
      </div>
    );
  }

  const customer = customerResult.value;
  const interactions = interactionsResult.status === "fulfilled" ? interactionsResult.value : [];
  const fullName = `${customer.firstName} ${customer.lastName}`.trim();

  return (
    <div className="flex flex-col gap-8">

      {/* ── Profile header ────────────────────────────────── */}
      <PageHeader
        title={fullName}
        back={<Link href={`${base}/customers`} className="text-xs text-text-muted hover:text-text-secondary transition-colors">← Customers</Link>}
        action={
          <Badge color={statusBadgeColor(customer.status)}>
            {customer.status}
          </Badge>
        }
        description={[customer.email, customer.phone, customer.address].filter(Boolean).join(" · ") || undefined}
      />

      {/* ── Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Total revenue" value={revenueLabel(customer.totalRevenue)} />
        <StatTile label="Interactions" value={interactions.length} />
        <StatTile label="Health score" value={customer.healthScore !== null ? Math.round(customer.healthScore) : "—"} />
        <StatTile label="Last contact" value={customer.lastContactAt ? timeAgo(customer.lastContactAt) : "Never"} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* ── Notes ─────────────────────────────────────────── */}
        {customer.notes && (
          <Card>
            <h2 className="mb-3 text-xs font-medium text-text-muted uppercase tracking-wide">Notes</h2>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{customer.notes}</p>
          </Card>
        )}

        {/* ── Source + meta ────────────────────────────────── */}
        <Card>
          <h2 className="mb-3 text-xs font-medium text-text-muted uppercase tracking-wide">Details</h2>
          <dl className="flex flex-col gap-2 text-sm">
            {customer.source && (
              <div className="flex justify-between">
                <dt className="text-text-muted">Source</dt>
                <dd className="capitalize text-text-secondary">{customer.source.replace(/_/g, " ")}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-text-muted">Customer since</dt>
              <dd className="text-text-secondary">{new Date(customer.createdAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* ── Timeline ──────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-text-primary">Timeline</h2>
          <span className="text-xs text-text-muted">{interactions.length} interactions</span>
        </div>

        <AddInteractionForm businessId={businessId} customerId={customerId} orgId={orgId} />

        {interactions.length === 0 ? (
          <EmptyState
            title="No interactions yet"
            description="Log the first one using the form above."
            dashed={false}
          />
        ) : (
          <div className="relative flex flex-col gap-0">
            <div className="absolute left-[17px] top-0 bottom-0 w-px bg-border" />
            {interactions.map((ix) => (
              <div key={ix.id} className="relative flex gap-4 pb-6">
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-base">
                  {INTERACTION_ICON[ix.type] ?? "💬"}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-text-secondary leading-relaxed">{ix.summary}</p>
                    <span className="shrink-0 text-xs text-text-muted">{timeAgo(ix.occurredAt)}</span>
                  </div>
                  <p className="mt-0.5 text-xs capitalize text-text-muted">{ix.type.replace(/_/g, " ")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
