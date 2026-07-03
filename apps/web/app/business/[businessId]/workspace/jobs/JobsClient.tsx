"use client";

import { useState } from "react";
import { apiClient } from "../../../../../src/lib/apiClient";

type Job = {
  id: string; title: string; description: string | null;
  status: string; priority: string; customerId: string | null;
  assignedTo: string | null; scheduledAt: string | null;
  startedAt: string | null; completedAt: string | null;
  estimatedDurationMinutes: number | null; location: string | null;
  tags: string[]; createdAt: string;
};

const STATUS_STYLE: Record<string, string> = {
  draft:       "bg-neutral-800 text-neutral-400",
  scheduled:   "bg-blue-900/40 text-blue-400",
  in_progress: "bg-yellow-900/40 text-yellow-400",
  on_hold:     "bg-orange-900/40 text-orange-400",
  completed:   "bg-green-900/40 text-green-400",
  cancelled:   "bg-neutral-800 text-neutral-500",
};

const PRIORITY_STYLE: Record<string, string> = {
  low:    "text-neutral-500",
  normal: "text-neutral-400",
  high:   "text-orange-400",
  urgent: "text-red-400",
};

const STATUS_TABS = ["all", "scheduled", "in_progress", "on_hold", "completed", "cancelled"];

function formatDate(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface Props {
  orgId: string;
  businessId: string;
  jobs: Job[];
  error: string | null;
}

export function JobsClient({ orgId, businessId, jobs: initialJobs, error: initialError }: Props) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [error, setError] = useState<string | null>(initialError);
  const [activeTab, setActiveTab] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [scheduledAt, setScheduledAt] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [location, setLocation] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = activeTab === "all" ? jobs : jobs.filter((j) => j.status === activeTab);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setFormError(null);
    try {
      const created = await apiClient.createJob(orgId, businessId, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        scheduledAt: scheduledAt || null,
        estimatedDurationMinutes: estimatedDuration ? parseInt(estimatedDuration) : null,
        location: location.trim() || null,
        assignedTo: assignedTo.trim() || null,
      });
      // Optimistically add to list
      const newJob: Job = {
        id: created.id, title: title.trim(), description: description.trim() || null,
        status: created.status, priority,
        customerId: null, assignedTo: assignedTo.trim() || null,
        scheduledAt: scheduledAt || null, startedAt: null, completedAt: null,
        estimatedDurationMinutes: estimatedDuration ? parseInt(estimatedDuration) : null,
        location: location.trim() || null, tags: [],
        createdAt: new Date().toISOString(),
      };
      setJobs([newJob, ...jobs]);
      setShowForm(false);
      setTitle(""); setDescription(""); setPriority("normal");
      setScheduledAt(""); setEstimatedDuration(""); setLocation(""); setAssignedTo("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusAction(jobId: string, action: "start" | "complete" | "hold" | "cancel") {
    try {
      let updated: { id: string; status: string };
      if (action === "start") {
        updated = await apiClient.startJob(orgId, businessId, jobId);
      } else if (action === "complete") {
        updated = await apiClient.completeJob(orgId, businessId, jobId);
      } else {
        const status = action === "hold" ? "on_hold" : "cancelled";
        updated = await apiClient.updateJob(orgId, businessId, jobId, { status });
      }
      setJobs(jobs.map((j) => j.id === jobId ? { ...j, status: updated.status } : j));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Jobs</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {jobs.length} total · {jobs.filter((j) => j.status === "in_progress").length} in progress
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="shrink-0 rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
        >
          + New Job
        </button>
      </div>

      {/* New Job slide-in panel */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={() => setShowForm(false)}>
          <div
            className="h-full w-full max-w-md overflow-y-auto bg-neutral-950 p-6 shadow-xl border-l border-neutral-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl">New Job</h2>
              <button onClick={() => setShowForm(false)} className="text-neutral-500 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Title *</label>
                <input
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. HVAC maintenance"
                  required
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Description</label>
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Priority</label>
                  <select
                    value={priority} onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-neutral-500 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Est. Duration (min)</label>
                  <input
                    type="number" min="1" value={estimatedDuration} onChange={(e) => setEstimatedDuration(e.target.value)}
                    className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-neutral-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Scheduled Date/Time</label>
                <input
                  type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-neutral-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Location</label>
                <input
                  value={location} onChange={(e) => setLocation(e.target.value)}
                  placeholder="Address or description"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Assigned To</label>
                <input
                  value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Employee name or ID"
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
                />
              </div>
              {formError && (
                <p className="text-sm text-red-400">{formError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit" disabled={loading}
                  className="flex-1 rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {loading ? "Creating…" : "Create Job"}
                </button>
                <button
                  type="button" onClick={() => setShowForm(false)}
                  className="rounded border border-neutral-700 px-4 py-2 text-sm text-neutral-400 hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-neutral-800 pb-0">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm capitalize whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? "border-red-600 text-white"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded border border-red-800 bg-red-950/30 p-4 text-sm text-red-400">{error}</div>
      )}

      {/* Empty state */}
      {!error && filtered.length === 0 && (
        <div className="rounded border border-neutral-800 bg-neutral-900 p-12 text-center">
          <p className="font-display text-lg text-neutral-300">
            {activeTab === "all" ? "No jobs yet" : `No ${activeTab.replace("_", " ")} jobs`}
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            {activeTab === "all" && "Start tracking work orders and field jobs for your business."}
          </p>
          {activeTab === "all" && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
            >
              Create your first job
            </button>
          )}
        </div>
      )}

      {/* Job list */}
      {filtered.length > 0 && (
        <div className="flex flex-col divide-y divide-neutral-800 rounded border border-neutral-800">
          {filtered.map((job) => (
            <div key={job.id} className="flex flex-col gap-2 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white truncate">{job.title}</p>
                    <span className={`shrink-0 text-xs font-medium uppercase ${PRIORITY_STYLE[job.priority] ?? ""}`}>
                      {job.priority}
                    </span>
                  </div>
                  {job.description && (
                    <p className="mt-0.5 text-xs text-neutral-500 truncate">{job.description}</p>
                  )}
                  <div className="mt-1 flex gap-3 text-xs text-neutral-600">
                    {job.scheduledAt && <span>Scheduled: {formatDate(job.scheduledAt)}</span>}
                    {job.location && <span>📍 {job.location}</span>}
                    {job.assignedTo && <span>👤 {job.assignedTo}</span>}
                    {job.estimatedDurationMinutes && <span>⏱ {job.estimatedDurationMinutes}min</span>}
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[job.status] ?? "bg-neutral-800 text-neutral-400"}`}>
                  {job.status.replace("_", " ")}
                </span>
              </div>
              {/* Actions */}
              <div className="flex gap-2">
                {job.status === "scheduled" && (
                  <button
                    onClick={() => handleStatusAction(job.id, "start")}
                    className="rounded bg-blue-900/40 px-3 py-1 text-xs text-blue-400 hover:bg-blue-900/60 transition-colors"
                  >
                    Start
                  </button>
                )}
                {job.status === "in_progress" && (
                  <>
                    <button
                      onClick={() => handleStatusAction(job.id, "complete")}
                      className="rounded bg-green-900/40 px-3 py-1 text-xs text-green-400 hover:bg-green-900/60 transition-colors"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => handleStatusAction(job.id, "hold")}
                      className="rounded bg-orange-900/40 px-3 py-1 text-xs text-orange-400 hover:bg-orange-900/60 transition-colors"
                    >
                      On Hold
                    </button>
                  </>
                )}
                {job.status === "on_hold" && (
                  <button
                    onClick={() => handleStatusAction(job.id, "start")}
                    className="rounded bg-blue-900/40 px-3 py-1 text-xs text-blue-400 hover:bg-blue-900/60 transition-colors"
                  >
                    Resume
                  </button>
                )}
                {(job.status === "scheduled" || job.status === "in_progress" || job.status === "on_hold") && (
                  <button
                    onClick={() => handleStatusAction(job.id, "cancel")}
                    className="rounded bg-neutral-800 px-3 py-1 text-xs text-neutral-500 hover:bg-neutral-700 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
