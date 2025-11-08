import React from 'react'

interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'text' | 'circle' | 'rectangle'
  count?: number
  className?: string
}

export default function LoadingSkeleton({ 
  variant = 'card', 
  count = 1,
  className = ''
}: LoadingSkeletonProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={`bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 animate-pulse ${className}`}>
            <div className="h-5 bg-white/10 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-white/10 rounded w-1/2 mb-3"></div>
            <div className="h-4 bg-white/10 rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-white/10 rounded-xl"></div>
          </div>
        )
      
      case 'list':
        return (
          <div className={`flex items-center space-x-4 p-4 bg-white/5 rounded-xl animate-pulse ${className}`}>
            <div className="w-12 h-12 bg-white/10 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-white/10 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-1/2"></div>
            </div>
          </div>
        )
      
      case 'text':
        return (
          <div className={`space-y-2 animate-pulse ${className}`}>
            <div className="h-4 bg-white/10 rounded w-full"></div>
            <div className="h-4 bg-white/10 rounded w-5/6"></div>
            <div className="h-4 bg-white/10 rounded w-4/6"></div>
          </div>
        )
      
      case 'circle':
        return (
          <div className={`w-12 h-12 bg-white/10 rounded-full animate-pulse ${className}`}></div>
        )
      
      case 'rectangle':
        return (
          <div className={`h-32 bg-white/10 rounded-xl animate-pulse ${className}`}></div>
        )
      
      default:
        return null
    }
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="mb-4 last:mb-0">
          {renderSkeleton()}
        </div>
      ))}
    </>
  )
}

// Specialized skeleton components for common use cases
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      {/* Header Skeleton */}
      <div className="flex items-center space-x-3 mb-6 animate-pulse">
        <div className="w-12 h-12 bg-white/10 rounded-2xl"></div>
        <div className="flex-1">
          <div className="h-5 bg-white/10 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-white/10 rounded w-1/4"></div>
        </div>
      </div>

      {/* Balance Card Skeleton */}
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 mb-8 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/4 mb-4"></div>
        <div className="h-10 bg-white/10 rounded w-1/2 mb-6"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-20 bg-white/10 rounded-xl"></div>
          <div className="h-20 bg-white/10 rounded-xl"></div>
          <div className="h-20 bg-white/10 rounded-xl"></div>
        </div>
      </div>

      {/* Plans Skeleton */}
      <LoadingSkeleton variant="card" count={3} />
    </div>
  )
}

export function WalletSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <LoadingSkeleton variant="rectangle" className="h-48" />
      <LoadingSkeleton variant="list" count={5} />
    </div>
  )
}

export function HistorySkeleton() {
  return (
    <div className="p-6 space-y-3">
      <LoadingSkeleton variant="list" count={8} />
    </div>
  )
}
