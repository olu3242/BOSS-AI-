"use client";

import { useState } from "react";
import { apiClient } from "../../../../../src/lib/apiClient";
import { EmptyState } from "../../../../../src/components/ui/EmptyState";
import { Input, Textarea } from "../../../../../src/components/ui/Input";
import { Button } from "../../../../../src/components/ui/Button";
import { PageHeader } from "../../../../../src/components/ui/PageHeader";
import { Badge } from "../../../../../src/components/ui/Badge";
import { Card } from "../../../../../src/components/ui/Card";

type Appointment = {
  id: string; title: string; notes: string | null;
  status: string; startAt: string; endAt: string;
  customerId: string | null; jobId: string | null;
  location: string | null; assignedTo: string | null;
  createdAt: string;
};

function apptStatusColor(status: string): "blue" | "green" | "yellow" | "neutral" {
  if (status === "scheduled") return "blue";
  if (status === "confirmed" || status === "completed") return "green";
  if (status === "in_progress") return "yellow";
  return "neutral";
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
      <PageHeader
        title="Appointments"
        description={`${appointments.length} total · ${appointments.filter((a) => a.status === "scheduled" || a.status === "confirmed").length} upcoming`}
        action={<Button onClick={() => setShowForm(true)}>+ New Appointment</Button>}
      />

      {/* Form panel */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={() => setShowForm(false)}>
          <div
            className="h-full w-full max-w-md overflow-y-auto bg-neutral-950 p-6 shadow-xl border-l border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl">New Appointment</h2>
              <button onClick={() => setShowForm(false)} className="text-text-muted hover:text-text-primary">✕</button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <Input label="Title *" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Initial consultation" required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Start *" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
                <Input label="End *" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} required />
              </div>
              <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Address or virtual link" />
              <Input label="Assigned To" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Employee name or ID" />
              <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              {formError && <p className="text-sm text-status-danger">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading} loading={loading} className="flex-1">
                  {loading ? "Creating…" : "Create Appointment"}
                </Button>
                <button
                  type="button" onClick={() => setShowForm(false)}
                  className="rounded border border-border px-4 py-2 text-sm text-text-muted hover:bg-elevated transition-colors"
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
        <EmptyState
          title="No appointments yet"
          description="Schedule appointments with customers and track them here."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="rounded bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
            >
              Book first appointment
            </button>
          }
        />
      )}

      {/* Calendar-style grouped list */}
      {appointments.length > 0 && (
        <div className="flex flex-col gap-6">
          {[...grouped.entries()].map(([day, appts]) => (
            <div key={day}>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-muted">{day}</p>
              <Card className="flex flex-col divide-y divide-border overflow-hidden">
                {appts.map((a) => (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="shrink-0 text-center w-12">
                      <p className="text-sm font-medium text-text-primary">
                        {new Date(a.startAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {new Date(a.endAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary truncate">{a.title}</p>
                      <div className="flex gap-3 text-xs text-text-muted mt-0.5">
                        {a.location && <span>📍 {a.location}</span>}
                        {a.assignedTo && <span>👤 {a.assignedTo}</span>}
                      </div>
                    </div>
                    <Badge color={apptStatusColor(a.status)}>{a.status.replace("_", " ")}</Badge>
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
                          className="rounded bg-elevated px-2 py-1 text-xs text-text-muted hover:bg-elevated/80 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
