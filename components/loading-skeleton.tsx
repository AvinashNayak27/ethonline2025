"use client";

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export default function LoadingSkeleton({ className = "", lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="loading-skeleton h-4 rounded"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="marketplace-card p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="loading-skeleton h-4 w-24 rounded" />
          <div className="loading-skeleton h-6 w-16 rounded-full" />
        </div>
        <LoadingSkeleton lines={3} />
        <div className="loading-skeleton h-10 w-full rounded" />
      </div>
    </div>
  );
}
