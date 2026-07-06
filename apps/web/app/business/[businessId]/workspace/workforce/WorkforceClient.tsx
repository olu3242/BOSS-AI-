"use client";

import { useState, useTransition } from "react";
import { apiClient } from "../../../../../src/lib/apiClient";

interface Employee {
  key: string;
  label: string;
  description: string;
  mission: string;
  capabilities: string[];
  lifecycle: string;
  kpis: string[];
}

interface Props {
  employees: Employee[];
  orgId: string;
}

const lifecycleBadge = (lc: string) => {
  if (lc === "available")
    return <span className="rounded-full bg-emerald-900/50 px-2 py-0.5 text-xs font-medium text-emerald-300">available</span>;
  if (lc === "deprecated")
    return <span className="rounded-full bg-red-900/50 px-2 py-0.5 text-xs font-medium text-red-400">deprecated</span>;
  return <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-400">{lc}</span>;
};

export function WorkforceClient({ employees: initial, orgId }: Props) {
  const [employees, setEmployees] = useState<Employee[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionKey, setActionKey] = useState<string | null>(null);

  const promote = (key: string) => {
    setError(null);
    setActionKey(key);
    startTransition(async () => {
      try {
        await apiClient.promoteEmployee(orgId, key);
        setEmployees((prev) => prev.map((e) => (e.key === key ? { ...e, lifecycle: "available" } : e)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to promote employee");
      } finally {
        setActionKey(null);
      }
    });
  };

  const deprecate = (key: string) => {
    setError(null);
    setActionKey(key);
    startTransition(async () => {
      try {
        await apiClient.deprecateEmployee(orgId, key);
        setEmployees((prev) => prev.map((e) => (e.key === key ? { ...e, lifecycle: "deprecated" } : e)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to deprecate employee");
      } finally {
        setActionKey(null);
      }
    });
  };

  const available = employees.filter((e) => e.lifecycle === "available");
  const deprecated = employees.filter((e) => e.lifecycle === "deprecated");
  const other = employees.filter((e) => e.lifecycle !== "available" && e.lifecycle !== "deprecated");

  const renderCard = (emp: Employee) => {
    const busy = isPending && actionKey === emp.key;
    return (
      <div key={emp.key} className="rounded border border-neutral-800 bg-neutral-900 p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display text-base font-semibold text-neutral-100">{emp.label}</span>
              {lifecycleBadge(emp.lifecycle)}
            </div>
            <p className="mt-1 text-xs text-neutral-500 font-mono">{emp.key}</p>
          </div>
        </div>

        <p className="text-sm text-neutral-400 leading-relaxed">{emp.mission}</p>

        {emp.capabilities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {emp.capabilities.map((c) => (
              <span key={c} className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">{c}</span>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-auto pt-2 border-t border-neutral-800">
          {emp.lifecycle !== "available" && (
            <button
              disabled={busy}
              onClick={() => promote(emp.key)}
              className="rounded px-3 py-1.5 text-xs font-medium bg-emerald-900/40 text-emerald-300 hover:bg-emerald-900/70 transition-colors disabled:opacity-50"
            >
              {busy ? "Promoting…" : "Promote"}
            </button>
          )}
          {emp.lifecycle !== "deprecated" && (
            <button
              disabled={busy}
              onClick={() => deprecate(emp.key)}
              className="rounded px-3 py-1.5 text-xs font-medium bg-neutral-800 text-neutral-400 hover:bg-red-900/40 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              {busy ? "Deprecating…" : "Deprecate"}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <div className="rounded border border-red-800 bg-red-950/30 p-3 text-sm text-red-400">{error}</div>
      )}

      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-display text-lg text-neutral-300">Available</h2>
          <span className="text-xs text-neutral-500 bg-neutral-800 rounded-full px-2 py-0.5">{available.length}</span>
        </div>
        {available.length === 0 ? (
          <p className="text-sm text-neutral-500">No available employees.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {available.map(renderCard)}
          </div>
        )}
      </section>

      {other.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-display text-lg text-neutral-300">Draft</h2>
            <span className="text-xs text-neutral-500 bg-neutral-800 rounded-full px-2 py-0.5">{other.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {other.map(renderCard)}
          </div>
        </section>
      )}

      {deprecated.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-display text-lg text-neutral-300 opacity-50">Deprecated</h2>
            <span className="text-xs text-neutral-500 bg-neutral-800 rounded-full px-2 py-0.5">{deprecated.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-50">
            {deprecated.map(renderCard)}
          </div>
        </section>
      )}
    </div>
  );
}
