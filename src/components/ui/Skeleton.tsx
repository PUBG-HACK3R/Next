import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  )
}

export { Skeleton }

// Investment Card Skeleton
export function InvestmentCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl p-4 shadow-lg">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-300 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <Skeleton className="h-3 w-3 rounded" />
              <Skeleton className="h-2 w-12" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      
      <div className="bg-gray-300 rounded-lg p-3">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <Skeleton className="h-3 w-24 mb-1" />
            <Skeleton className="h-5 w-20 mb-2" />
            <Skeleton className="h-2 w-32" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// Stats Grid Skeleton
export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg p-2.5 shadow-lg">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-2 w-16" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  )
}

// Page Loading Skeleton
export function PageLoadingSkeleton() {
  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      
      <StatsGridSkeleton />
      
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <InvestmentCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
