import { Skeleton } from "@/components/ui/skeleton";

interface ProductModerationSkeletonProps {
  count?: number;
}

export function ProductModerationSkeleton({ count = 3 }: ProductModerationSkeletonProps) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-xl" />
      ))}
    </div>
  );
}
