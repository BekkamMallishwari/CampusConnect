import { type ReactNode } from 'react';

export type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const toneClasses: Record<BadgeTone, string> = {
  primary: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  danger: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
  neutral: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  info: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
};

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
  dot?: boolean;
};

export function Badge({ children, tone = 'neutral', className = '', dot = false }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-tight ${toneClasses[tone]} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            tone === 'success'
              ? 'bg-emerald-500'
              : tone === 'warning'
              ? 'bg-amber-500'
              : tone === 'danger'
              ? 'bg-red-500'
              : tone === 'primary'
              ? 'bg-blue-500'
              : tone === 'info'
              ? 'bg-cyan-500'
              : 'bg-gray-400'
          }`}
        />
      )}
      {children}
    </span>
  );
}

export function getStatusTone(status?: string): BadgeTone {
  const s = (status || '').toLowerCase();
  if (['returned', 'matched', 'completed', 'accepted', 'verified', 'paid', 'success', 'confirmed'].some((w) => s.includes(w)))
    return 'success';
  if (['pending', 'waiting', 'possiblematch', 'review', 'degraded'].some((w) => s.includes(w)))
    return 'warning';
  if (['rejected', 'failed', 'blocked', 'declined'].some((w) => s.includes(w)))
    return 'danger';
  return 'primary';
}
