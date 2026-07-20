"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard/error]", {
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex flex-col gap-4 rounded border border-red-800 bg-red-950/30 p-6 text-red-400">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-red-500">Dashboard Error</p>
        <h2 className="mt-1 font-display text-xl font-bold text-white">Dashboard could not load</h2>
      </div>
      <div className="rounded bg-black/40 px-4 py-3 font-mono text-xs text-red-300">
        <p className="font-semibold">Request reference</p>
        {error.digest && (
          <p className="mt-2 text-red-500">Digest: {error.digest}</p>
        )}
      </div>
      <p className="text-sm text-red-300">
        Retry the request. If it continues to fail, provide the request reference to support.
      </p>
      <button
        onClick={reset}
        type="button"
        className="self-start rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
