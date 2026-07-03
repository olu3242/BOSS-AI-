"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiClient, ApiClientError } from "../../../src/lib/apiClient";

export function NewBusinessClient({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    try {
      const { business } = await apiClient.createBusiness(orgId, {
        name: form.get("name"),
        industry: form.get("industry"),
        businessType: form.get("businessType"),
        employeeCount: Number(form.get("employeeCount")),
        annualRevenue: Number(form.get("annualRevenue")),
        yearsOperating: Number(form.get("yearsOperating")),
        locationCount: Number(form.get("locationCount")),
        businessHours: form.get("businessHours"),
      });
      router.push(`/business/${business.id}/mri`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.body.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-16">
      <h1 className="font-display text-3xl">Set up your business</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Business name" name="name" required />
        <Field label="Industry" name="industry" required defaultValue="general_smb" />
        <Field label="Business type (e.g. LLC, Sole Proprietor, Corporation)" name="businessType" required defaultValue="LLC" />
        <Field label="Employee count" name="employeeCount" type="number" required defaultValue="1" />
        <Field label="Annual revenue" name="annualRevenue" type="number" required defaultValue="0" />
        <Field label="Years operating" name="yearsOperating" type="number" required defaultValue="0" />
        <Field label="Location count" name="locationCount" type="number" required defaultValue="1" />
        <Field label="Business hours" name="businessHours" required defaultValue="Mon-Fri 9am-5pm" />

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-accent px-4 py-2 font-display text-white disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create business"}
        </button>
      </form>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-neutral-300">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
      />
    </label>
  );
}
