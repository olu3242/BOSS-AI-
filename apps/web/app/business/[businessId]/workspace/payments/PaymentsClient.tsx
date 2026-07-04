"use client";

import { useState } from "react";
import { apiClient } from "../../../../../src/lib/apiClient";
import { EmptyState } from "../../../../../src/components/ui/EmptyState";
import { Input, Select } from "../../../../../src/components/ui/Input";
import { Button } from "../../../../../src/components/ui/Button";
import { PageHeader } from "../../../../../src/components/ui/PageHeader";

type Payment = {
  id: string; customerId: string; invoiceId: string;
  amountCents: number; currency: string; method: string; status: string;
  reference: string | null; notes: string | null; paidAt: string | null; createdAt: string;
};

type Invoice = {
  id: string; invoiceNumber: string; customerId: string; status: string;
  totalCents: number; currency: string; createdAt: string;
};

const STATUS_STYLE: Record<string, string> = {
  pending:   "bg-yellow-900/40 text-yellow-400",
  completed: "bg-green-900/40 text-green-400",
  failed:    "bg-red-900/40 text-red-400",
  refunded:  "bg-purple-900/40 text-purple-400",
};

const METHOD_STYLE: Record<string, string> = {
  cash:          "bg-neutral-800 text-neutral-300",
  card:          "bg-blue-900/40 text-blue-300",
  bank_transfer: "bg-cyan-900/40 text-cyan-300",
  check:         "bg-neutral-700 text-neutral-300",
  other:         "bg-neutral-800 text-neutral-400",
};

const STATUS_TABS = ["all", "pending", "completed", "refunded"];

function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

function formatDate(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface Props {
  orgId: string;
  businessId: string;
  payments: Payment[];
  invoices: Invoice[];
  error: string | null;
}

export function PaymentsClient({ orgId, businessId, payments: initialPayments, invoices, error: initialError }: Props) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [error, setError] = useState<string | null>(initialError);
  const [activeTab, setActiveTab] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [invoiceId, setInvoiceId] = useState("");
  const [amountCents, setAmountCents] = useState("");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [paidAt, setPaidAt] = useState("");

  const unpaidInvoices = invoices.filter((i) => !["paid", "cancelled"].includes(i.status));
  const filtered = activeTab === "all" ? payments : payments.filter((p) => p.status === activeTab);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!invoiceId) { setFormError("Please select an invoice"); return; }
    const cents = Math.round(parseFloat(amountCents) * 100);
    if (isNaN(cents) || cents <= 0) { setFormError("Enter a valid amount"); return; }
    setLoading(true);
    setFormError(null);
    try {
      const inv = invoices.find((i) => i.id === invoiceId);
      await apiClient.createPayment(orgId, businessId, {
        customerId: inv?.customerId ?? "",
        invoiceId,
        amountCents: cents,
        method: method as Parameters<typeof apiClient.createPayment>[2]["method"],
        reference: reference || null,
        notes: notes || null,
        paidAt: paidAt || null,
      });
      const full = await apiClient.listPayments(orgId, businessId);
      setPayments(full);
      setShowForm(false);
      setInvoiceId(""); setAmountCents(""); setMethod("cash"); setReference(""); setNotes(""); setPaidAt("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(payment: Payment, status: string) {
    try {
      await apiClient.updatePaymentStatus(orgId, businessId, payment.id, status);
      const full = await apiClient.listPayments(orgId, businessId);
      setPayments(full);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update payment");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description={`${payments.length} total payment${payments.length !== 1 ? "s" : ""}`}
        action={<Button onClick={() => setShowForm(!showForm)}>Record Payment</Button>}
      />

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-400">
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 space-y-4">
          <h2 className="font-semibold text-neutral-100">Record Payment</h2>
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Invoice *" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
              <option value="">Select invoice…</option>
              {unpaidInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {formatMoney(inv.totalCents, inv.currency)}
                </option>
              ))}
            </Select>
            <Input label="Amount *" type="number" step="0.01" min="0.01" value={amountCents} onChange={(e) => setAmountCents(e.target.value)} placeholder="0.00" />
            <Select label="Payment Method *" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
              <option value="other">Other</option>
            </Select>
            <Input label="Paid Date" type="datetime-local" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
            <Input label="Reference / Transaction ID" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="txn_xxx" />
            <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} loading={loading}>
              {loading ? "Saving…" : "Record Payment"}
            </Button>
            <button type="button" onClick={() => { setShowForm(false); setFormError(null); }}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-400 hover:text-white">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-800 pb-0">
        {STATUS_TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab ? "border-accent text-accent" : "border-transparent text-neutral-400 hover:text-white"
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No payments found"
          description="Record payments received from customers to track your cash flow."
          action={
            <button onClick={() => setShowForm(true)}
              className="rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors">
              Record first payment
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((payment) => (
            <div key={payment.id} className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-neutral-100">{formatMoney(payment.amountCents, payment.currency)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[payment.status] ?? "bg-neutral-800 text-neutral-400"}`}>
                      {payment.status}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${METHOD_STYLE[payment.method] ?? "bg-neutral-800 text-neutral-400"}`}>
                      {payment.method.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-neutral-500 space-x-3">
                    <span>Invoice: <span className="text-neutral-400 font-mono">{payment.invoiceId.slice(0, 8)}…</span></span>
                    {payment.reference && <span>Ref: <span className="text-neutral-400">{payment.reference}</span></span>}
                    <span>Paid: {formatDate(payment.paidAt)}</span>
                    <span>Created: {formatDate(payment.createdAt)}</span>
                  </div>
                  {payment.notes && <p className="mt-1 text-sm text-neutral-400">{payment.notes}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {payment.status === "pending" && (
                    <button onClick={() => handleStatusChange(payment, "completed")}
                      className="rounded-lg bg-green-900/40 px-3 py-1.5 text-xs text-green-400 hover:bg-green-900/60 transition-colors">
                      Mark Complete
                    </button>
                  )}
                  {payment.status === "completed" && (
                    <button onClick={() => handleStatusChange(payment, "refunded")}
                      className="rounded-lg bg-purple-900/40 px-3 py-1.5 text-xs text-purple-400 hover:bg-purple-900/60 transition-colors">
                      Refund
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
