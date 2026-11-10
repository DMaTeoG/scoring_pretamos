import React from "react";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      tabIndex={-1}
      aria-hidden="true"
      className={`relative overflow-hidden bg-slate-200 dark:bg-slate-800/60 rounded-md before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 dark:before:via-white/5 before:to-transparent ${className}`}
    />
  );
}

export function CompanySkeleton() {
  return (
    <div className="bank-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
        <Skeleton className="h-9 w-44 rounded-xl" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-900/70 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800/80 pt-4 space-y-3">
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800/50 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EvaluationSkeleton() {
  return (
    <div className="bank-card p-6 rounded-2xl border border-blue-300 dark:border-blue-500/20 space-y-6 animate-pulse">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-8 w-36 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        <div className="md:col-span-1 p-6 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex flex-col items-center space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 w-32 rounded-lg" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>

        <div className="md:col-span-3 grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <Skeleton className="h-4 w-52" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/70 flex items-center justify-between"
            >
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 4, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 animate-pulse py-2">
      <div className="grid grid-cols-6 gap-3 pb-2 border-b border-slate-200 dark:border-slate-800/80 px-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid grid-cols-6 gap-3 py-3 border-b border-slate-100 dark:border-slate-800/40 px-3 items-center"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-3.5 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}
