export default function LoadingSpinner() {
  return (
    <div className="flex min-h-[260px] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 animate-spin rounded-full border border-slate-200 border-t-blue-600 dark:border-slate-700" />
          <div className="h-4 w-4 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 shadow-[0_0_24px_rgba(37,99,235,0.28)]" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">Loading campus workspace</p>
      </div>
    </div>
  );
}
