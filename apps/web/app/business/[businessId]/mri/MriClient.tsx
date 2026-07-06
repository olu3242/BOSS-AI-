"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient, ApiClientError } from "../../../../src/lib/apiClient";

const QUESTIONS = [
  {
    sectionKey: "identity",
    questionKey: "primary_challenge",
    label: "What is the biggest challenge your business faces right now?",
    type: "text" as const,
    placeholder: "e.g. Finding new customers, managing cash flow, hiring staff...",
  },
  {
    sectionKey: "customers",
    questionKey: "monthly_new_customers",
    label: "How many new customers do you acquire per month on average?",
    type: "number" as const,
    placeholder: "e.g. 10",
  },
  {
    sectionKey: "finance",
    questionKey: "monthly_revenue",
    label: "What is your approximate monthly revenue? (USD)",
    type: "number" as const,
    placeholder: "e.g. 25000",
  },
  {
    sectionKey: "operations",
    questionKey: "manual_hours_per_week",
    label: "How many hours per week do you spend on manual, repetitive tasks?",
    type: "number" as const,
    placeholder: "e.g. 15",
  },
  {
    sectionKey: "goals",
    questionKey: "primary_goal_12_months",
    label: "What is your primary business goal for the next 12 months?",
    type: "text" as const,
    placeholder: "e.g. Grow revenue by 30%, open a second location, hire 5 people...",
  },
];

export function MriClient({ businessId, orgId }: { businessId: string; orgId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [mriId, setMriId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = QUESTIONS[step]!;
  const isLast = step === QUESTIONS.length - 1;
  const progress = Math.round(((step) / QUESTIONS.length) * 100);

  async function handleNext(value: string) {
    setError(null);
    setSubmitting(true);

    try {
      let activeMriId = mriId;
      if (!activeMriId) {
        const mri = await apiClient.startMri(orgId, businessId);
        activeMriId = mri.id;
        setMriId(activeMriId);
      }

      await apiClient.submitMriAnswer(
        orgId,
        activeMriId,
        question.sectionKey,
        question.questionKey,
        question.type === "number" ? Number(value) : value
      );

      const newAnswers = { ...answers, [question.questionKey]: value };
      setAnswers(newAnswers);

      if (isLast) {
        const sections = [...new Set(QUESTIONS.map((q) => q.sectionKey))];
        for (const section of sections) {
          await apiClient.completeMriSection(orgId, activeMriId, section);
        }
        await apiClient.completeMri(orgId, activeMriId);
        router.push(`/business/${businessId}/mri/complete`);
      } else {
        setStep(step + 1);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.body.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = String(form.get("answer") ?? "").trim();
    if (!value) return;
    handleNext(value);
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
      <div>
        <p className="text-sm font-medium text-accent uppercase tracking-wide">Business MRI</p>
        <h1 className="mt-2 font-display text-3xl">Let&apos;s understand your business</h1>
        <p className="mt-2 text-text-muted">
          Answer {QUESTIONS.length} quick questions so BOSS can generate your health score and first recommendations.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-text-muted mb-2">
          <span>Question {step + 1} of {QUESTIONS.length}</span>
          <span>{progress}% complete</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-elevated">
          <div
            className="h-1.5 rounded-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <div>
          <label className="flex flex-col gap-3 text-sm">
            <span className="text-lg text-text-primary font-medium">{question.label}</span>
            <input
              key={step}
              name="answer"
              type={question.type === "number" ? "number" : "text"}
              placeholder={question.placeholder}
              required
              min={question.type === "number" ? 0 : undefined}
              autoFocus
              className="rounded border border-border bg-surface px-4 py-3 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex items-center gap-4">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="rounded border border-border px-4 py-2 text-sm text-text-secondary hover:border-border-strong"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-accent px-6 py-2 font-display text-sm text-white disabled:opacity-50"
          >
            {submitting ? "Saving…" : isLast ? "Complete MRI →" : "Next →"}
          </button>
        </div>
      </form>

      <div className="flex gap-2 flex-wrap">
        {QUESTIONS.map((q, i) => (
          <span
            key={i}
            className={`rounded px-2 py-1 text-xs ${
              i < step
                ? "bg-green-900/40 text-green-400"
                : i === step
                  ? "bg-accent/20 text-accent"
                  : "bg-elevated text-text-muted"
            }`}
          >
            {q.sectionKey}
          </span>
        ))}
      </div>
    </main>
  );
}
