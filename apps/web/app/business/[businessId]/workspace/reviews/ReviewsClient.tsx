"use client";

import { useState } from "react";
import { apiClient } from "../../../../../src/lib/apiClient";
import { EmptyState } from "../../../../../src/components/ui/EmptyState";
import { Input, Textarea } from "../../../../../src/components/ui/Input";
import { Button } from "../../../../../src/components/ui/Button";
import { PageHeader } from "../../../../../src/components/ui/PageHeader";
import { Badge } from "../../../../../src/components/ui/Badge";
import { Card } from "../../../../../src/components/ui/Card";

type Review = {
  id: string; customerId: string; jobId: string | null; rating: number;
  title: string | null; body: string | null; status: string; source: string;
  response: string | null; respondedAt: string | null; createdAt: string;
};

function reviewStatusColor(status: string): "yellow" | "green" | "red" | "neutral" {
  if (status === "pending") return "yellow";
  if (status === "published") return "green";
  if (status === "flagged") return "red";
  return "neutral";
}

function reviewSourceColor(source: string): "blue" | "red" | "neutral" {
  if (source === "google" || source === "facebook") return "blue";
  if (source === "yelp") return "red";
  return "neutral";
}

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
      <PageHeader
        title="Reviews"
        description={publishedReviews.length > 0
          ? `${avgRating.toFixed(1)} ★ average — ${publishedReviews.length} published review${publishedReviews.length !== 1 ? "s" : ""}`
          : "No published reviews yet"}
        action={<Button onClick={() => setShowForm(!showForm)}>Add Review</Button>}
      />

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-400">
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
        </div>
      )}

      {/* Rating distribution */}
      {publishedReviews.length > 0 && (
        <Card>
          <div className="flex items-center gap-6">
            <div className="text-center shrink-0">
              <div className="text-4xl font-bold text-text-primary">{avgRating.toFixed(1)}</div>
              <div className="text-yellow-400 text-lg">{"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}</div>
              <div className="text-xs text-text-muted mt-1">{publishedReviews.length} reviews</div>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((star) => (
                <button key={star} onClick={() => setRatingFilter(ratingFilter === star ? null : star)}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1 text-xs transition-colors ${ratingFilter === star ? "bg-elevated" : "hover:bg-elevated/60"}`}>
                  <span className="text-yellow-400 w-8">{star}★</span>
                  <div className="flex-1 h-1.5 rounded-full bg-elevated">
                    <div className="h-full rounded-full bg-yellow-400" style={{ width: `${publishedReviews.length > 0 ? ((ratingCounts[star] ?? 0) / publishedReviews.length) * 100 : 0}%` }} />
                  </div>
                  <span className="text-text-muted w-6 text-right">{ratingCounts[star] ?? 0}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {showForm && (
        <Card padding="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <h2 className="font-semibold text-text-primary">Add Review</h2>
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Customer ID *" value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="Customer ID" />
            <div>
              <label className="block text-xs text-text-secondary mb-1">Rating *</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setRating(s)}
                    className={`text-2xl transition-colors ${s <= rating ? "text-yellow-400" : "text-text-muted"}`}>
                    ★
                  </button>
                ))}
              </div>
            </div>
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="sm:col-span-2">
              <Textarea label="Review" value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} loading={loading}>
              {loading ? "Saving…" : "Add Review"}
            </Button>
            <button type="button" onClick={() => { setShowForm(false); setFormError(null); }}
              className="rounded border border-border px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors">
              Cancel
            </button>
          </div>
        </form>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {["all", "pending", "published", "flagged", "hidden"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab ? "border-accent text-accent" : "border-transparent text-text-muted hover:text-text-primary"
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
            <Card key={review.id} className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Stars rating={review.rating} />
                    <Badge color={reviewStatusColor(review.status)}>{review.status}</Badge>
                    <Badge color={reviewSourceColor(review.source)}>{review.source}</Badge>
                  </div>
                  {review.title && <p className="mt-1 font-medium text-text-primary">{review.title}</p>}
                  {review.body && <p className="mt-1 text-sm text-text-secondary">{review.body}</p>}
                  <p className="mt-2 text-xs text-text-muted">{formatDate(review.createdAt)}</p>
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
                      className="rounded px-2 py-1 text-xs bg-elevated text-text-muted hover:bg-border transition-colors">
                      Hide
                    </button>
                  )}
                </div>
              </div>

              {review.response && (
                <div className="rounded border border-border bg-elevated p-3">
                  <p className="text-xs text-text-muted mb-1">Your response · {formatDate(review.respondedAt)}</p>
                  <p className="text-sm text-text-secondary">{review.response}</p>
                </div>
              )}

              {respondingId === review.id ? (
                <div className="space-y-2">
                  <Textarea value={responseText} onChange={(e) => setResponseText(e.target.value)}
                    rows={3} placeholder="Write your response…" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleRespond(review.id)}>
                      Save Response
                    </Button>
                    <button onClick={() => { setRespondingId(null); setResponseText(""); }}
                      className="rounded border border-border px-3 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
