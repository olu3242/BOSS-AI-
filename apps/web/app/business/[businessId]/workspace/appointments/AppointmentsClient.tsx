"use client";

import { useState } from "react";
import { apiClient } from "../../../../../src/lib/apiClient";

type Appointment = {
  id: string; title: string; notes: string | null;
  status: string; startAt: string; endAt: string;
  customerId: string | null; jobId: string | null;
  location: string | null; assignedTo: string | null;
  createdAt: string;
};

const STATUS_STYLE: Record<string, string> = {
  scheduled:   "bg-blue-900/40 text-blue-400",
  confirmed:   "bg-green-900/40 text-green-400",
  in_progress: "bg-yellow-900/40 text-yellow-400",
  completed:   "bg-green-900/60 text-green-300",
  cancelled:   "bg-neutral-800 text-neutral-500",
  no_show:     "bg-neutral-800 text-neutral-400",
};

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function groupByDay(appts: Appointment[]) {
  const groups = new Map<string, Appointment[]>();
  for (const a of appts) {
    const day = new Date(a.startAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    const list = groups.get(day) ?? [];
    list.push(a);
    groups.set(day, list);
  }
  return groups;
}

interface Props {
  orgId: string;
  businessId: string;
  appointments: Appointment[];
  error: string | null;
}

export function AppointmentsClient({ orgId, businessId, appointments: initialAppts, error: initialError }: Props) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppts);
  const [error, setError] = useState<string | null>(initialError);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const grouped = groupByDay(appointments);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startAt || !endAt) return;
    setLoading(true);
    setFormError(null);
    try {
      const created = await apiClient.createAppointment(orgId, businessId, {
        title: title.trim(),
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        notes: notes.trim() || null,
        location: location.trim() || null,
        assignedTo: assignedTo.trim() || null,
      });
      const newAppt: Appointment = {
        id: created.id, title: title.trim(), notes: notes.trim() || null,
        status: created.status,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        customerId: null, jobId: null,
        location: location.trim() || null, assignedTo: assignedTo.trim() || null,
        createdAt: new Date().toISOString(),
      };
      setAppointments([...appointments, newAppt].sort((a, b) => a.startAt.localeCompare(b.startAt)));
      setShowForm(false);
      setTitle(""); setStartAt(""); setEndAt(""); setNotes(""); setLocation(""); setAssignedTo("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create appointment");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(id: string) {
    try {
      await apiClient.confirmAppointment(orgId, businessId, id);
      setAppointments(appointments.map((a) => a.id === id ? { ...a, status: "confirmed" } : a));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm");
    }
  }

  async function handleCancel(id: string) {
    try {
      await apiClient.cancelAppointment(orgId, businessId, id);
      setAppointments(appointments.map((a) => a.id === id ? { ...a, status: "cancelled" } : a));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Appointments</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {appointments.length} total · {appointments.filter((a) => a.status === "scheduled" || a.status === "confirmed").length} upcoming
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="shrink-0 rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
        >
          + New Appointment
        </button>
      </div>

      {/* Form panel */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={() => setShowForm(false)}>
          <div
            className="h-full w-full max-w-md overflow-y-auto bg-neutral-950 p-6 shadow-xl border-l border-neutral-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl">New Appointment</h2>
              <button onClick={() => setShowForm(false)} className="text-neutral-500 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Title *</label>
                <input
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Initial consultation"
                  required
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Start *</label>
                  <input
                    type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)}
                    required
                    className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-neutral-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">End *</label>
                  <input
                    type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)}
                    required
                    className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-neutral-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Location</label>
                <input
                  value={location} onChange={(e) => setLocation(e.target.value)}
                  placeholder="Address or virtual link"
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
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Notes</label>
                <textarea
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
                />
              </div>
              {formError && <p className="text-sm text-red-400">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit" disabled={loading}
                  className="flex-1 rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {loading ? "Creating…" : "Create Appointment"}
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

      {/* Error */}
      {error && (
        <div className="rounded border border-red-800 bg-red-950/30 p-4 text-sm text-red-400">{error}</div>
      )}

      {/* Empty state */}
      {!error && appointments.length === 0 && (
        <div className="rounded border border-neutral-800 bg-neutral-900 p-12 text-center">
          <p className="font-display text-lg text-neutral-300">No appointments yet</p>
          <p className="mt-2 text-sm text-neutral-500">Schedule appointments with customers and track them here.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
          >
            Book first appointment
          </button>
        </div>
      )}

      {/* Calendar-style grouped list */}
      {appointments.length > 0 && (
        <div className="flex flex-col gap-6">
          {[...grouped.entries()].map(([day, appts]) => (
            <div key={day}>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">{day}</p>
              <div className="flex flex-col divide-y divide-neutral-800 rounded border border-neutral-800">
                {appts.map((a) => (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="shrink-0 text-center w-12">
                      <p className="text-sm font-medium text-white">
                        {new Date(a.startAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                      <p className="text-[10px] text-neutral-600">
                        {new Date(a.endAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{a.title}</p>
                      <div className="flex gap-3 text-xs text-neutral-600 mt-0.5">
                        {a.location && <span>📍 {a.location}</span>}
                        {a.assignedTo && <span>👤 {a.assignedTo}</span>}
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[a.status] ?? "bg-neutral-800 text-neutral-400"}`}>
                      {a.status.replace("_", " ")}
                    </span>
                    <div className="flex gap-2 shrink-0">
                      {a.status === "scheduled" && (
                        <button
                          onClick={() => handleConfirm(a.id)}
                          className="rounded bg-green-900/40 px-2 py-1 text-xs text-green-400 hover:bg-green-900/60 transition-colors"
                        >
                          Confirm
                        </button>
                      )}
                      {(a.status === "scheduled" || a.status === "confirmed") && (
                        <button
                          onClick={() => handleCancel(a.id)}
                          className="rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-700 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
