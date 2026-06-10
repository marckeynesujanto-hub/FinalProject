interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-gray-200 ${className}`}
      aria-hidden
    />
  )
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-20 border border-gray-100" />
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 pt-16">
      <Skeleton className="h-32 w-full mb-4" />
      <CardSkeleton count={4} />
    </div>
  )
}
