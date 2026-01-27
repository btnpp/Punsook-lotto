import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-700/50", className)}
      {...props}
    />
  );
}

// Card skeleton for dashboard stats
function CardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

// Table skeleton
function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 p-4 border-b border-slate-700">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// List skeleton
function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/30">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

// Dashboard page skeleton
function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <TableSkeleton rows={5} cols={4} />
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <ListSkeleton items={4} />
        </div>
      </div>
    </div>
  );
}

// Agents page skeleton
function AgentsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header with button */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      {/* Agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// History page skeleton
function HistorySkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
      {/* Table */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50">
        <TableSkeleton rows={8} cols={8} />
      </div>
    </div>
  );
}

// Risk page skeleton
function RiskSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      {/* Filters */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-48 ml-auto" />
      </div>
      {/* Table */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50">
        <div className="p-4">
          <Skeleton className="h-6 w-40 mb-4" />
        </div>
        <TableSkeleton rows={10} cols={8} />
      </div>
    </div>
  );
}

// Reports page skeleton
function ReportsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      {/* Tabs content */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <TableSkeleton rows={8} cols={6} />
      </div>
    </div>
  );
}

// Settings page skeleton
function SettingsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Tabs */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      {/* Content card */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

// Rounds page skeleton
function RoundsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Lottery type tabs */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      {/* Round cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Results page skeleton
function ResultsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <Skeleton className="h-8 w-48" />
      {/* Pending rounds */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      {/* History table */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <TableSkeleton rows={6} cols={6} />
      </div>
    </div>
  );
}

// Users page skeleton
function UsersSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      {/* Filters */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      {/* Table */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50">
        <TableSkeleton rows={8} cols={7} />
      </div>
    </div>
  );
}

// Bets page skeleton
function BetsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Lottery type tabs */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      {/* Form card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-slate-700 bg-slate-800/50 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        {/* Summary */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Layoff page skeleton
function LayoffSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      {/* Filters */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      {/* Table */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50">
        <TableSkeleton rows={8} cols={8} />
      </div>
    </div>
  );
}

export { 
  Skeleton, 
  CardSkeleton, 
  TableSkeleton, 
  ListSkeleton,
  DashboardSkeleton,
  AgentsSkeleton,
  HistorySkeleton,
  RiskSkeleton,
  ReportsSkeleton,
  SettingsSkeleton,
  RoundsSkeleton,
  ResultsSkeleton,
  UsersSkeleton,
  BetsSkeleton,
  LayoffSkeleton,
};
