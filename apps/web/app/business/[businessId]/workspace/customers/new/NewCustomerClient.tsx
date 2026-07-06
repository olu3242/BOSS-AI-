"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { apiClient, ApiClientError } from "../../../../../../src/lib/apiClient";
import { Input, Select, Textarea } from "../../../../../../src/components/ui/Input";
import { Button } from "../../../../../../src/components/ui/Button";
import { PageHeader } from "../../../../../../src/components/ui/PageHeader";

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

export function NewCustomerClient({ orgId }: { orgId: string }) {
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
      const customer = await apiClient.createCustomer(orgId, businessId, {
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
      <PageHeader
        title="Add customer"
        description="Create a customer record and start tracking their history."
        back={<Link href={`${base}/customers`} className="text-xs text-text-muted hover:text-text-secondary transition-colors">← Customers</Link>}
      />

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name *" name="firstName" required autoFocus />
          <Field label="Last name" name="lastName" />
        </div>
        <Field label="Email" name="email" type="email" />
        <Field label="Phone" name="phone" type="tel" />
        <Field label="Address" name="address" />

        <Select label="How did they find you?" name="source">
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>

        <Textarea label="Notes" name="notes" rows={4} placeholder="Anything worth remembering about this customer…" />

        {error && <p className="text-sm text-status-danger">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting} loading={submitting}>
            {submitting ? "Creating…" : "Create customer"}
          </Button>
          <Link
            href={`${base}/customers`}
            className="rounded bg-elevated px-5 py-2 text-sm text-text-muted hover:bg-border transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, type = "text", required, autoFocus }: {
  label: string; name: string; type?: string; required?: boolean; autoFocus?: boolean;
}) {
  return <Input label={label} name={name} type={type} required={required} autoFocus={autoFocus} />;
}
