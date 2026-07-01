"use client";

import { useState } from "react";
import { apiClient, ApiClientError } from "../lib/apiClient";
import { DEMO_ORG_ID } from "../lib/demoOrg";

interface FeedbackButtonProps {
  businessId: string;
}

export function FeedbackButton({ businessId }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const message = String(form.get("message") ?? "").trim();
    const category = String(form.get("category") ?? "general");
    try {
      await apiClient.submitFeedback(DEMO_ORG_ID, {
        message,
        businessId,
        pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
        category,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.body.message : "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hover:text-neutral-400 transition-colors"
      >
        Report a problem
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-6" onClick={() => !submitting && setOpen(false)}>
      <div
        className="w-full max-w-sm rounded-lg border border-neutral-700 bg-neutral-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-sm text-white">Report a problem</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-neutral-500 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>

        {submitted ? (
          <div className="py-4 text-center">
            <p className="text-sm text-green-400 font-medium">Thank you — we received your report.</p>
            <p className="mt-1 text-xs text-neutral-500">Our team will follow up within 24 hours.</p>
            <button
              type="button"
              onClick={() => { setOpen(false); setSubmitted(false); }}
              className="mt-4 text-xs text-neutral-400 hover:text-white"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <select
              name="category"
              className="rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white"
            >
              <option value="general">General feedback</option>
              <option value="bug">Bug report</option>
              <option value="feature">Feature request</option>
              <option value="data">Data issue</option>
              <option value="performance">Performance</option>
            </select>
            <textarea
              name="message"
              required
              placeholder="Describe what happened or what you'd like to see..."
              rows={4}
              className="rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-600 resize-none focus:border-accent focus:outline-none"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Send report"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
