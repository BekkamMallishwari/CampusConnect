export function CardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-5 space-y-4 shadow-[0_16px_44px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900">
      <div className="h-44 w-full rounded-[1.1rem] bg-slate-100 dark:bg-slate-800" />
      <div className="space-y-2">
        <div className="h-5 w-2/3 rounded-lg bg-slate-100 dark:bg-slate-800" />
        <div className="h-4 w-full rounded-lg bg-slate-100 dark:bg-slate-800" />
        <div className="h-4 w-4/5 rounded-lg bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-3 w-16 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        <div key={i} className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 bg-white p-6 animate-pulse shadow-[0_16px_44px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-8 w-16 rounded-lg bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

export default function LoadingSkeleton() {
  return <GridSkeleton count={6} />;
}
