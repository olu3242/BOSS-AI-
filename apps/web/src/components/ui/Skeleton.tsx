import type { ReactNode } from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-elevated ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonPage({
  stats = 4,
  rows = 5,
  children,
}: {
  stats?: number;
  rows?: number;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading…">
      {/* PageHeader skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      {/* Stat strip */}
      {stats > 0 && (
        <div className={`grid gap-4 grid-cols-${Math.min(stats, 4)}`}>
          {Array.from({ length: stats }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}
      {/* Content rows */}
      {children ?? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}
    </div>
  );
}
