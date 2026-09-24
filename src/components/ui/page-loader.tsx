import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export function PageLoader() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex w-64 border-r flex-col p-4 space-y-4 bg-card shrink-0">
        <div className="flex items-center gap-3 pb-4 border-b">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="space-y-2 flex-1 pt-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
        <div className="pt-4 border-t space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar Skeleton */}
        <div className="h-16 border-b flex items-center justify-between px-6 bg-card">
          <Skeleton className="h-6 w-48" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>

          {/* Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>

          {/* Table / List Area */}
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
