import { SkeletonPage, Skeleton } from "../../src/components/ui/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage stats={0}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </SkeletonPage>
  );
}
