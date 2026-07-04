import Link from "next/link";
import { apiClient, ApiClientError } from "../../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../../src/server/auth";
import { AddInteractionForm } from "./AddInteractionForm";
import { EmptyState } from "../../../../../../src/components/ui/EmptyState";

interface Props {
  params: Promise<{ businessId: string; customerId: string }>;
}

const STATUS_STYLE: Record<string, string> = {
  prospect: "bg-yellow-900/40 text-yellow-400 border-yellow-900",
  active:   "bg-green-900/40 text-green-400 border-green-900",
  inactive: "bg-neutral-800 text-neutral-500 border-neutral-700",
  vip:      "bg-purple-900/40 text-purple-300 border-purple-900",
  churned:  "bg-red-900/40 text-red-400 border-red-900",
};

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
        <Link href={`${base}/customers`} className="text-sm text-neutral-500 hover:text-neutral-300">
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

      {/* ── Breadcrumb ────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Link href={`${base}/customers`} className="hover:text-neutral-300 transition-colors">Customers</Link>
        <span>/</span>
        <span className="text-neutral-300">{fullName}</span>
      </div>

      {/* ── Profile header ────────────────────────────────── */}
      <div className="flex items-start gap-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-neutral-800 font-display text-xl font-bold text-neutral-300">
          {`${customer.firstName[0] ?? ""}${customer.lastName[0] ?? ""}`.toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl">{fullName}</h1>
            <span className={`rounded border px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[customer.status] ?? "bg-neutral-800 text-neutral-400 border-neutral-700"}`}>
              {customer.status}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-400">
            {customer.email && <span>{customer.email}</span>}
            {customer.phone && <span>{customer.phone}</span>}
            {customer.address && <span>{customer.address}</span>}
          </div>
          {customer.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {customer.tags.map((t) => (
                <span key={t} className="rounded bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-500">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total revenue", value: revenueLabel(customer.totalRevenue) },
          { label: "Interactions", value: interactions.length.toString() },
          { label: "Health score", value: customer.healthScore !== null ? `${Math.round(customer.healthScore)}` : "—" },
          { label: "Last contact", value: customer.lastContactAt ? timeAgo(customer.lastContactAt) : "Never" },
        ].map((s) => (
          <div key={s.label} className="rounded border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">{s.label}</p>
            <p className="mt-1 font-display text-2xl">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* ── Notes ─────────────────────────────────────────── */}
        {customer.notes && (
          <section className="rounded border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="mb-3 font-display text-sm text-neutral-400 uppercase tracking-wide">Notes</h2>
            <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">{customer.notes}</p>
          </section>
        )}

        {/* ── Source + meta ────────────────────────────────── */}
        <section className="rounded border border-neutral-800 bg-neutral-900 p-5">
          <h2 className="mb-3 font-display text-sm text-neutral-400 uppercase tracking-wide">Details</h2>
          <dl className="flex flex-col gap-2 text-sm">
            {customer.source && (
              <div className="flex justify-between">
                <dt className="text-neutral-500">Source</dt>
                <dd className="capitalize text-neutral-300">{customer.source.replace(/_/g, " ")}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-neutral-500">Customer since</dt>
              <dd className="text-neutral-300">{new Date(customer.createdAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </section>
      </div>

      {/* ── Timeline ──────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-neutral-300">Timeline</h2>
          <span className="text-xs text-neutral-600">{interactions.length} interactions</span>
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
            <div className="absolute left-[17px] top-0 bottom-0 w-px bg-neutral-800" />
            {interactions.map((ix) => (
              <div key={ix.id} className="relative flex gap-4 pb-6">
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950 text-base">
                  {INTERACTION_ICON[ix.type] ?? "💬"}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-neutral-200 leading-relaxed">{ix.summary}</p>
                    <span className="shrink-0 text-xs text-neutral-600">{timeAgo(ix.occurredAt)}</span>
                  </div>
                  <p className="mt-0.5 text-xs capitalize text-neutral-600">{ix.type.replace(/_/g, " ")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
