"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { apiClient, ApiClientError } from "../../../../../../src/lib/apiClient";
import { DEMO_ORG_ID } from "../../../../../../src/lib/demoOrg";

const SOURCES = [
  { value: "", label: "— Select source —" },
  { value: "walk_in", label: "Walk-in" },
  { value: "referral", label: "Referral" },
  { value: "online", label: "Online" },
  { value: "phone", label: "Phone inquiry" },
  { value: "social_media", label: "Social media" },
  { value: "repeat", label: "Returning customer" },
  { value: "other", label: "Other" },
];

export default function NewCustomerPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = `/business/${businessId}/workspace`;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const customer = await apiClient.createCustomer(DEMO_ORG_ID, businessId, {
        firstName: String(form.get("firstName") ?? ""),
        lastName: String(form.get("lastName") ?? ""),
        email: String(form.get("email") || "") || null,
        phone: String(form.get("phone") || "") || null,
        address: String(form.get("address") || "") || null,
        source: String(form.get("source") || "") || null,
        notes: String(form.get("notes") || "") || null,
      });
      router.push(`${base}/customers/${customer.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.body.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-xl">
      <div>
        <Link href={`${base}/customers`} className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">
          ← Customers
        </Link>
        <h1 className="mt-3 font-display text-3xl">Add customer</h1>
        <p className="mt-1 text-sm text-neutral-500">Create a customer record and start tracking their history.</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name *" name="firstName" required autoFocus />
          <Field label="Last name" name="lastName" />
        </div>
        <Field label="Email" name="email" type="email" />
        <Field label="Phone" name="phone" type="tel" />
        <Field label="Address" name="address" />

        <div className="flex flex-col gap-1">
          <label className="text-sm text-neutral-400">How did they find you?</label>
          <select
            name="source"
            className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-neutral-500 focus:outline-none"
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-neutral-400">Notes</label>
          <textarea
            name="notes"
            rows={4}
            placeholder="Anything worth remembering about this customer…"
            className="resize-none rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-red-700 px-5 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Creating…" : "Create customer"}
          </button>
          <Link
            href={`${base}/customers`}
            className="rounded bg-neutral-800 px-5 py-2 text-sm text-neutral-400 hover:bg-neutral-700 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  autoFocus,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-neutral-400">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        autoFocus={autoFocus}
        className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
      />
    </div>
  );
}
