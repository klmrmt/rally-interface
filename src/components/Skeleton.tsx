export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[var(--color-text)]/[0.06] ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="w-full rounded-xl border border-[var(--color-text)]/[0.06] bg-[var(--color-bg-elevated)] p-4">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-32 mt-3" />
      <Skeleton className="h-3 w-24 mt-2" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-4" role="status" aria-label="Loading page">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="space-y-3 pt-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
