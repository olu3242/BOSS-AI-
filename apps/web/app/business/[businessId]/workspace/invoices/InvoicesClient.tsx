"use client";

import { useState } from "react";
import { apiClient } from "../../../../../src/lib/apiClient";
import { EmptyState } from "../../../../../src/components/ui/EmptyState";
import { Input, Textarea } from "../../../../../src/components/ui/Input";
import { Button } from "../../../../../src/components/ui/Button";
import { PageHeader } from "../../../../../src/components/ui/PageHeader";

type Invoice = {
  id: string; invoiceNumber: string; customerId: string; jobId: string | null;
  status: string; subtotalCents: number; taxCents: number; discountCents: number;
  totalCents: number; currency: string; dueAt: string | null;
  sentAt: string | null; paidAt: string | null; createdAt: string;
};

type LineItemDraft = { description: string; quantity: number; unitPriceCents: number };

const STATUS_STYLE: Record<string, string> = {
  draft:     "bg-elevated text-text-muted",
  sent:      "bg-blue-900/40 text-blue-400",
  viewed:    "bg-blue-900/40 text-blue-300",
  paid:      "bg-green-900/40 text-green-400",
  overdue:   "bg-red-900/40 text-red-400",
  cancelled: "bg-elevated text-text-muted",
  refunded:  "bg-purple-900/40 text-purple-400",
};

const STATUS_TABS = ["all", "draft", "sent", "paid", "overdue"];

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
  invoices: Invoice[];
  error: string | null;
}

export function InvoicesClient({ orgId, businessId, invoices: initialInvoices, error: initialError }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [error, setError] = useState<string | null>(initialError);
  const [activeTab, setActiveTab] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [notes, setNotes] = useState("");
  const [taxPercent, setTaxPercent] = useState("0");
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([
    { description: "", quantity: 1, unitPriceCents: 0 },
  ]);

  const filtered = activeTab === "all" ? invoices : invoices.filter((i) => i.status === activeTab);

  const totalOwed = invoices.filter((i) => i.status === "sent" || i.status === "overdue")
    .reduce((s, i) => s + i.totalCents, 0);
  const totalPaid = invoices.filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.totalCents, 0);

  function updateLineItem(idx: number, field: keyof LineItemDraft, value: string | number) {
    setLineItems(lineItems.map((li, i) => i === idx ? { ...li, [field]: value } : li));
  }

  function addLineItem() {
    setLineItems([...lineItems, { description: "", quantity: 1, unitPriceCents: 0 }]);
  }

  function removeLineItem(idx: number) {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== idx));
  }

  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unitPriceCents, 0);
  const tax = Math.round(subtotal * (parseFloat(taxPercent) / 100));
  const total = subtotal + tax;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId.trim()) { setFormError("Customer ID is required"); return; }
    if (lineItems.some((li) => !li.description.trim())) { setFormError("All line items need a description"); return; }
    setLoading(true);
    setFormError(null);
    try {
      const created = await apiClient.createInvoice(orgId, businessId, {
        customerId: customerId.trim(),
        lineItems: lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitPriceCents: li.unitPriceCents,
        })),
        taxCents: tax,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        notes: notes.trim() || null,
      });
      const newInvoice: Invoice = {
        id: created.id, invoiceNumber: created.invoiceNumber,
        customerId: customerId.trim(), jobId: null,
        status: created.status, subtotalCents: subtotal, taxCents: tax,
        discountCents: 0, totalCents: total, currency: "USD",
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        sentAt: null, paidAt: null, createdAt: new Date().toISOString(),
      };
      setInvoices([newInvoice, ...invoices]);
      setShowForm(false);
      setCustomerId(""); setDueAt(""); setNotes(""); setTaxPercent("0");
      setLineItems([{ description: "", quantity: 1, unitPriceCents: 0 }]);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(id: string) {
    try {
      const result = await apiClient.sendInvoice(orgId, businessId, id);
      setInvoices(invoices.map((i) => i.id === id ? { ...i, status: result.status, sentAt: result.sentAt } : i));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    }
  }

  async function handleMarkPaid(id: string) {
    try {
      const result = await apiClient.markInvoicePaid(orgId, businessId, id);
      setInvoices(invoices.map((i) => i.id === id ? { ...i, status: result.status, paidAt: result.paidAt } : i));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark paid");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Invoices"
        description={`${invoices.length} total · ${formatMoney(totalOwed)} outstanding · ${formatMoney(totalPaid)} paid`}
        action={<Button onClick={() => setShowForm(true)}>+ Create Invoice</Button>}
      />

      {/* Create Invoice panel */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={() => setShowForm(false)}>
          <div
            className="h-full w-full max-w-lg overflow-y-auto bg-neutral-950 p-6 shadow-xl border-l border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl">Create Invoice</h2>
              <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-primary">✕</button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <Input label="Customer ID *" value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="Customer UUID" required />

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-text-muted">Line Items</label>
                  <button
                    type="button" onClick={addLineItem}
                    className="text-xs text-red-500 hover:text-red-400 transition-colors"
                  >
                    + Add row
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-12 gap-1 text-[10px] text-text-muted px-1">
                    <span className="col-span-5">Description</span>
                    <span className="col-span-2 text-right">Qty</span>
                    <span className="col-span-3 text-right">Unit Price</span>
                    <span className="col-span-1"></span>
                  </div>
                  {lineItems.map((li, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-1">
                      <input
                        value={li.description}
                        onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                        placeholder="Description"
                        className="col-span-5 rounded border border-border bg-surface px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-border-strong focus:outline-none"
                      />
                      <input
                        type="number" min="1" value={li.quantity}
                        onChange={(e) => updateLineItem(idx, "quantity", parseInt(e.target.value) || 1)}
                        className="col-span-2 rounded border border-border bg-surface px-2 py-1.5 text-xs text-text-primary text-right focus:border-border-strong focus:outline-none"
                      />
                      <input
                        type="number" min="0" step="1" value={li.unitPriceCents}
                        onChange={(e) => updateLineItem(idx, "unitPriceCents", parseInt(e.target.value) || 0)}
                        placeholder="Cents"
                        className="col-span-3 rounded border border-border bg-surface px-2 py-1.5 text-xs text-text-primary text-right focus:border-border-strong focus:outline-none"
                      />
                      <button
                        type="button" onClick={() => removeLineItem(idx)}
                        className="col-span-1 flex items-center justify-center text-text-muted hover:text-red-500 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-col items-end gap-1 text-sm">
                  <div className="flex items-center gap-4">
                    <label className="text-xs text-text-muted">Tax %</label>
                    <input
                      type="number" min="0" max="100" step="0.1" value={taxPercent}
                      onChange={(e) => setTaxPercent(e.target.value)}
                      className="w-20 rounded border border-border bg-surface px-2 py-1 text-xs text-text-primary text-right focus:border-border-strong focus:outline-none"
                    />
                  </div>
                  <p className="text-text-muted text-xs">Subtotal: {formatMoney(subtotal)}</p>
                  <p className="text-text-muted text-xs">Tax: {formatMoney(tax)}</p>
                  <p className="font-medium text-text-primary">Total: {formatMoney(total)}</p>
                </div>
              </div>

              <Input label="Due Date" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
              <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />

              {formError && <p className="text-sm text-status-danger">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading} loading={loading} className="flex-1">
                  {loading ? "Creating…" : "Create Invoice"}
                </Button>
                <button
                  type="button" onClick={() => setShowForm(false)}
                  className="rounded border border-border px-4 py-2 text-sm text-text-muted hover:bg-elevated transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm capitalize whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? "border-red-600 text-white"
                : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded border border-red-800 bg-red-950/30 p-4 text-sm text-red-400">{error}</div>
      )}

      {/* Empty state */}
      {!error && filtered.length === 0 && (
        <EmptyState
          title={activeTab === "all" ? "No invoices yet" : `No ${activeTab} invoices`}
          description={activeTab === "all" ? "Create invoices to track payments from your customers." : undefined}
          action={activeTab === "all" ? (
            <button
              onClick={() => setShowForm(true)}
              className="rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            >
              Create first invoice
            </button>
          ) : undefined}
        />
      )}

      {/* Invoice list */}
      {filtered.length > 0 && (
        <div className="flex flex-col divide-y divide-border rounded border border-border">
          {filtered.map((inv) => (
            <div key={inv.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm text-text-secondary">{inv.invoiceNumber}</p>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[inv.status] ?? "bg-elevated text-text-muted"}`}>
                    {inv.status}
                  </span>
                </div>
                <div className="mt-1 flex gap-3 text-xs text-text-muted">
                  <span>Customer: {inv.customerId.slice(0, 8)}…</span>
                  {inv.dueAt && <span>Due: {formatDate(inv.dueAt)}</span>}
                  {inv.paidAt && <span>Paid: {formatDate(inv.paidAt)}</span>}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-medium text-text-primary">{formatMoney(inv.totalCents, inv.currency)}</p>
                <p className="text-[11px] text-text-muted">{inv.currency}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {inv.status === "draft" && (
                  <button
                    onClick={() => handleSend(inv.id)}
                    className="rounded bg-blue-900/40 px-3 py-1 text-xs text-blue-400 hover:bg-blue-900/60 transition-colors"
                  >
                    Send
                  </button>
                )}
                {(inv.status === "sent" || inv.status === "viewed" || inv.status === "overdue") && (
                  <button
                    onClick={() => handleMarkPaid(inv.id)}
                    className="rounded bg-green-900/40 px-3 py-1 text-xs text-green-400 hover:bg-green-900/60 transition-colors"
                  >
                    Mark Paid
                  </button>
                )}
                <button
                  onClick={() => {
                    // PDF generation coming soon
                    alert("PDF generation coming soon");
                  }}
                  className="rounded bg-elevated px-3 py-1 text-xs text-text-muted hover:bg-border transition-colors"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
