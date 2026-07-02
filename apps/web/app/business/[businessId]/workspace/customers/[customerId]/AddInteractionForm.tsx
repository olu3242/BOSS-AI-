"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../../../../src/lib/apiClient";
import { DEMO_ORG_ID } from "../../../../../../src/lib/demoOrg";

const TYPES = [
  { value: "note", label: "Note" },
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "appointment", label: "Appointment" },
  { value: "invoice", label: "Invoice" },
  { value: "in_person", label: "In Person" },
];

export function AddInteractionForm({
  businessId,
  customerId,
}: {
  businessId: string;
  customerId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState("");
  const [type, setType] = useState("note");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim()) return;
    setError(null);
    try {
      await apiClient.addCustomerInteraction(DEMO_ORG_ID, businessId, customerId, {
        type,
        summary: summary.trim(),
      });
      setSummary("");
      setOpen(false);
      startTransition(() => router.refresh());
    } catch {
      setError("Failed to save interaction");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-6 flex w-full items-center gap-2 rounded border border-dashed border-neutral-700 bg-neutral-900/40 px-4 py-3 text-sm text-neutral-500 hover:border-neutral-600 hover:text-neutral-400 transition-colors"
      >
        <span className="text-lg">+</span> Log interaction
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded border border-neutral-700 bg-neutral-900 p-4">
      <div className="mb-3 flex gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${type === t.value ? "bg-red-800 text-white" : "bg-neutral-800 text-neutral-500 hover:text-neutral-300"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="What happened? Add a note, log a call, record an email…"
        rows={3}
        autoFocus
        className="w-full resize-none rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
      />
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={isPending || !summary.trim()}
          className="rounded bg-red-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Saving…" : "Log"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setSummary(""); }}
          className="rounded bg-neutral-800 px-4 py-1.5 text-sm text-neutral-400 hover:bg-neutral-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
