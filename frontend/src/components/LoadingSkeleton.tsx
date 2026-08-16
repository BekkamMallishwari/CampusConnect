export function CardSkeleton() {
  return (
    <div className="glass-panel overflow-hidden p-5 space-y-4 animate-pulse">
      <div className="h-44 w-full rounded-2xl bg-slate-200/70 dark:bg-slate-800/70" />
      <div className="space-y-2">
        <div className="h-5 w-2/3 rounded-lg bg-slate-200/70 dark:bg-slate-800/70" />
        <div className="h-3.5 w-full rounded-lg bg-slate-200/60 dark:bg-slate-800/60" />
        <div className="h-3.5 w-4/5 rounded-lg bg-slate-200/60 dark:bg-slate-800/60" />
      </div>
      <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/50 pt-3">
        <div className="h-3 w-20 rounded-full bg-slate-200/60 dark:bg-slate-800/60" />
        <div className="h-3 w-16 rounded-full bg-slate-200/60 dark:bg-slate-800/60" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-stat-card p-5 flex items-center justify-between animate-pulse">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded-full bg-slate-200/70 dark:bg-slate-800/70" />
            <div className="h-8 w-16 rounded-lg bg-slate-200/70 dark:bg-slate-800/70" />
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-200/70 dark:bg-slate-800/70" />
        </div>
      ))}
    </div>
  );
}

export default function LoadingSkeleton() {
  return <GridSkeleton count={6} />;
}
