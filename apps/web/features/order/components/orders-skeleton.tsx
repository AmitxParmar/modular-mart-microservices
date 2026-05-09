export function OrdersSkeleton() {
  return (
    <div className="flex flex-col space-y-8">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center space-x-2">
        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        <span className="text-muted-foreground/40">/</span>
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
      </div>

      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded" />
      </div>

      {/* Orders List Skeleton */}
      <div className="space-y-6 mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            {/* Header Bar Skeleton */}
            <div className="bg-muted/40 px-4 py-3 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-border">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className={j === 2 ? "hidden sm:block" : ""}>
                  <div className="h-3 w-16 bg-muted/60 animate-pulse rounded mb-2" />
                  <div className="h-4 w-24 bg-muted/80 animate-pulse rounded" />
                </div>
              ))}
            </div>

            {/* Content Area Skeleton */}
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-6">
              <div className="flex-1 space-y-6">
                {/* Status Skeleton */}
                <div className="flex items-center gap-2">
                  <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-6 w-20 bg-muted/60 animate-pulse rounded-full" />
                </div>

                {/* Items Skeleton */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-muted animate-pulse rounded shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-1/4 bg-muted/60 animate-pulse rounded" />
                      <div className="h-4 w-20 bg-muted animate-pulse rounded mt-2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons Skeleton */}
              <div className="sm:w-48 flex flex-col gap-2 shrink-0">
                {[1, 2, 3, 4].map((b) => (
                  <div key={b} className="h-9 w-full bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            </div>

            {/* Footer Skeleton */}
            <div className="px-4 py-3 sm:px-6 bg-muted/10 border-t border-border flex justify-between">
              <div className="h-3 w-40 bg-muted/40 animate-pulse rounded" />
              <div className="h-3 w-24 bg-muted/40 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
