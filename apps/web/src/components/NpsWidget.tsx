"use client";

import { useState } from "react";
import { apiClient } from "../lib/apiClient";
import { DEMO_ORG_ID } from "../lib/demoOrg";

interface NpsWidgetProps {
  businessId: string;
  context?: string;
}

export function NpsWidget({ businessId, context = "BOSS" }: NpsWidgetProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (selected === null) return;
    setSubmitting(true);
    try {
      await apiClient.submitNps(DEMO_ORG_ID, { businessId, score: selected, comment: comment || undefined });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded border border-neutral-800 bg-neutral-900 p-6 text-center">
        <p className="text-green-400 font-medium">Thank you for your feedback!</p>
        <p className="mt-1 text-sm text-neutral-500">Your response helps us improve {context}.</p>
      </div>
    );
  }

  return (
    <div className="rounded border border-neutral-800 bg-neutral-900 p-6">
      <p className="text-sm font-medium text-white mb-1">
        How likely are you to recommend {context} to another business owner?
      </p>
      <p className="text-xs text-neutral-500 mb-4">0 = Not at all likely, 10 = Extremely likely</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelected(i)}
            className={`w-10 h-10 rounded text-sm font-medium transition-colors ${
              selected === i
                ? "bg-accent text-white"
                : "border border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-accent hover:text-white"
            }`}
          >
            {i}
          </button>
        ))}
      </div>

      {selected !== null && (
        <>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What's the main reason for your score? (optional)"
            rows={2}
            className="w-full rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-600 resize-none focus:border-accent focus:outline-none mb-3"
          />
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="rounded bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </>
      )}
    </div>
  );
}
