"use client";

import { useState } from "react";
import { apiClient } from "../../../../../src/lib/apiClient";
import { EmptyState } from "../../../../../src/components/ui/EmptyState";

type Review = {
  id: string; customerId: string; jobId: string | null; rating: number;
  title: string | null; body: string | null; status: string; source: string;
  response: string | null; respondedAt: string | null; createdAt: string;
};

const STATUS_STYLE: Record<string, string> = {
  pending:   "bg-yellow-900/40 text-yellow-400",
  published: "bg-green-900/40 text-green-400",
  flagged:   "bg-red-900/40 text-red-400",
  hidden:    "bg-neutral-800 text-neutral-500",
};

const SOURCE_STYLE: Record<string, string> = {
  internal: "bg-neutral-800 text-neutral-300",
  google:   "bg-blue-900/40 text-blue-300",
  yelp:     "bg-red-900/40 text-red-300",
  facebook: "bg-blue-900/40 text-blue-400",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400">
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

function formatDate(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface Props {
  orgId: string;
  businessId: string;
  reviews: Review[];
  error: string | null;
}

export function ReviewsClient({ orgId, businessId, reviews: initialReviews, error: initialError }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [error, setError] = useState<string | null>(initialError);
  const [activeTab, setActiveTab] = useState("all");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const publishedReviews = reviews.filter((r) => r.status === "published");
  const avgRating = publishedReviews.length > 0
    ? publishedReviews.reduce((s, r) => s + r.rating, 0) / publishedReviews.length
    : 0;

  const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of publishedReviews) {
    ratingCounts[r.rating] = (ratingCounts[r.rating] ?? 0) + 1;
  }

  let filtered = activeTab === "all" ? reviews : reviews.filter((r) => r.status === activeTab);
  if (ratingFilter !== null) filtered = filtered.filter((r) => r.rating === ratingFilter);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId.trim()) { setFormError("Customer ID is required"); return; }
    setLoading(true); setFormError(null);
    try {
      await apiClient.createReview(orgId, businessId, { customerId, rating, title: title || null, body: body || null });
      const all = await apiClient.listReviews(orgId, businessId);
      setReviews(all);
      setShowForm(false);
      setCustomerId(""); setRating(5); setTitle(""); setBody("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create review");
    } finally {
      setLoading(false);
    }
  }

  async function handleRespond(reviewId: string) {
    if (!responseText.trim()) return;
    try {
      await apiClient.respondToReview(orgId, businessId, reviewId, responseText);
      const all = await apiClient.listReviews(orgId, businessId);
      setReviews(all);
      setRespondingId(null);
      setResponseText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save response");
    }
  }

  async function handleStatus(review: Review, status: string) {
    try {
      await apiClient.updateReviewStatus(orgId, businessId, review.id, status);
      const all = await apiClient.listReviews(orgId, businessId);
      setReviews(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Reviews</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {publishedReviews.length > 0
              ? `${avgRating.toFixed(1)} ★ average — ${publishedReviews.length} published review${publishedReviews.length !== 1 ? "s" : ""}`
              : "No published reviews yet"}
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors">
          Add Review
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-400">
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
        </div>
      )}

      {/* Rating distribution */}
      {publishedReviews.length > 0 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
          <div className="flex items-center gap-6">
            <div className="text-center shrink-0">
              <div className="text-4xl font-bold text-neutral-100">{avgRating.toFixed(1)}</div>
              <div className="text-yellow-400 text-lg">{"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}</div>
              <div className="text-xs text-neutral-500 mt-1">{publishedReviews.length} reviews</div>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((star) => (
                <button key={star} onClick={() => setRatingFilter(ratingFilter === star ? null : star)}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1 text-xs transition-colors ${ratingFilter === star ? "bg-neutral-800" : "hover:bg-neutral-900"}`}>
                  <span className="text-yellow-400 w-8">{star}★</span>
                  <div className="flex-1 h-1.5 rounded-full bg-neutral-800">
                    <div className="h-full rounded-full bg-yellow-400" style={{ width: `${publishedReviews.length > 0 ? ((ratingCounts[star] ?? 0) / publishedReviews.length) * 100 : 0}%` }} />
                  </div>
                  <span className="text-neutral-500 w-6 text-right">{ratingCounts[star] ?? 0}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 space-y-4">
          <h2 className="font-semibold text-neutral-100">Add Review</h2>
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Customer ID *</label>
              <input type="text" value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                placeholder="Customer ID"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100" />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Rating *</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setRating(s)}
                    className={`text-2xl transition-colors ${s <= rating ? "text-yellow-400" : "text-neutral-700"}`}>
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-neutral-400 mb-1">Review</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50">
              {loading ? "Saving…" : "Add Review"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setFormError(null); }}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-400 hover:text-white">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-800">
        {["all", "pending", "published", "flagged", "hidden"].map((tab) => (
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
          title="No reviews found"
          description="Collect and manage customer reviews to build your reputation."
          action={
            <button onClick={() => setShowForm(true)}
              className="rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors">
              Add first review
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => (
            <div key={review.id} className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Stars rating={review.rating} />
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[review.status] ?? "bg-neutral-800 text-neutral-400"}`}>
                      {review.status}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${SOURCE_STYLE[review.source] ?? "bg-neutral-800 text-neutral-400"}`}>
                      {review.source}
                    </span>
                  </div>
                  {review.title && <p className="mt-1 font-medium text-neutral-100">{review.title}</p>}
                  {review.body && <p className="mt-1 text-sm text-neutral-400">{review.body}</p>}
                  <p className="mt-2 text-xs text-neutral-500">{formatDate(review.createdAt)}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {review.status === "pending" && (
                    <button onClick={() => handleStatus(review, "published")}
                      className="rounded px-2 py-1 text-xs bg-green-900/40 text-green-400 hover:bg-green-900/60">
                      Publish
                    </button>
                  )}
                  {review.status !== "flagged" && (
                    <button onClick={() => handleStatus(review, "flagged")}
                      className="rounded px-2 py-1 text-xs bg-red-900/40 text-red-400 hover:bg-red-900/60">
                      Flag
                    </button>
                  )}
                  {review.status !== "hidden" && (
                    <button onClick={() => handleStatus(review, "hidden")}
                      className="rounded px-2 py-1 text-xs bg-neutral-800 text-neutral-400 hover:bg-neutral-700">
                      Hide
                    </button>
                  )}
                </div>
              </div>

              {review.response && (
                <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-3">
                  <p className="text-xs text-neutral-500 mb-1">Your response · {formatDate(review.respondedAt)}</p>
                  <p className="text-sm text-neutral-300">{review.response}</p>
                </div>
              )}

              {respondingId === review.id ? (
                <div className="space-y-2">
                  <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)}
                    rows={3} placeholder="Write your response…"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100" />
                  <div className="flex gap-2">
                    <button onClick={() => handleRespond(review.id)}
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs text-white hover:bg-accent/90">
                      Save Response
                    </button>
                    <button onClick={() => { setRespondingId(null); setResponseText(""); }}
                      className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:text-white">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setRespondingId(review.id); setResponseText(review.response ?? ""); }}
                  className="text-xs text-accent hover:underline">
                  {review.response ? "Edit response" : "Respond"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
