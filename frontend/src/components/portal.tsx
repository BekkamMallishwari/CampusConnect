import { motion, type MotionProps } from 'framer-motion';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type PortalTone = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

const toneClasses: Record<PortalTone, string> = {
  primary: 'border-indigo-200/80 bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/50',
  secondary: 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--dash-text-secondary)]',
  accent: 'border-cyan-200/80 bg-cyan-50/80 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800/50',
  success: 'border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50',
  warning: 'border-amber-200/80 bg-amber-50/80 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50',
  danger: 'border-rose-200/80 bg-rose-50/80 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/50',
  neutral: 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--dash-text-primary)]',
};

export function portalToneClass(tone: PortalTone = 'neutral') {
  return toneClasses[tone];
}

export function PortalSection({
  title,
  eyebrow,
  description,
  action,
  children,
  className = '',
}: {
  title?: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`space-y-4 ${className}`}>
      {(title || eyebrow || description || action) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            {eyebrow && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/40">
                {eyebrow}
              </span>
            )}
            {title && (
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
                {title}
              </h2>
            )}
            {description && (
              <p className="max-w-3xl text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function PortalCard({
  children,
  className = '',
  animate = true,
}: {
  children: ReactNode;
  className?: string;
  animate?: boolean;
}) {
  const base = `glass-panel overflow-hidden p-5 transition-all duration-200`;
  if (!animate) return <div className={`${base} ${className}`}>{children}</div>;
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className={`${base} ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function PortalBadge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode;
  tone?: PortalTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${portalToneClass(tone)} ${className}`}
    >
      {children}
    </span>
  );
}

export function PortalButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ComponentPropsWithoutRef<'button'> & MotionProps & {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  className?: string;
}) {
  const variants: Record<'primary' | 'secondary' | 'danger' | 'success', string> = {
    primary: 'dash-btn-primary',
    secondary: 'dash-btn-secondary',
    danger: 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition',
    success: 'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function PortalStatCard({
  label,
  value,
  icon,
  tone = 'primary',
  delta,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: PortalTone;
  delta?: string;
}) {
  return (
    <div className="glass-stat-card p-4 sm:p-5 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-muted)' }}>
            {label}
          </p>
          <p className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
            {value}
          </p>
          {delta && <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">{delta}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-xs ${portalToneClass(tone)}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function PortalInput({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`glass-input h-10 w-full px-3.5 text-xs font-medium outline-none transition placeholder:text-[var(--placeholder)] ${className}`}
    />
  );
}

export function PortalTextarea({
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`glass-input w-full px-3.5 py-2.5 text-xs font-medium outline-none transition placeholder:text-[var(--placeholder)] ${className}`}
    />
  );
}

export function PortalSelect({
  className = '',
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`glass-input h-10 w-full px-3.5 text-xs font-medium outline-none transition ${className}`}
    />
  );
}

export function PortalProgress({ value, tone = 'primary' }: { value: number; tone?: PortalTone }) {
  const fillClass =
    tone === 'success'
      ? 'bg-emerald-500'
      : tone === 'warning'
      ? 'bg-amber-500'
      : tone === 'danger'
      ? 'bg-rose-500'
      : tone === 'accent'
      ? 'bg-cyan-500'
      : 'bg-gradient-to-r from-indigo-500 to-purple-600';

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div className={`h-full rounded-full transition-all duration-300 ${fillClass}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export const getPrimaryImage = (item?: { imageUrl?: string; images?: string[] | null }) => {
  const gallery = item?.images?.filter(Boolean) ?? [];
  return item?.imageUrl || gallery[0] || '';
};

export const formatCampusDate = (date?: string) => {
  if (!date) return 'Unknown date';
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return date;
  return value.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export function getStatusTone(status?: string): PortalTone {
  const normalized = (status || '').toLowerCase();
  if (['returned', 'matched', 'completed', 'accepted', 'verified', 'paid', 'success'].some((word) => normalized.includes(word))) return 'success';
  if (['pending', 'waiting', 'possiblematch', 'degraded', 'review'].some((word) => normalized.includes(word))) return 'warning';
  if (['rejected', 'failed', 'blocked'].some((word) => normalized.includes(word))) return 'danger';
  return 'primary';
}

export function AvatarBadge({
  name,
  avatar,
  size = 'md',
}: {
  name?: string;
  avatar?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}) {
  const sizeClass =
    size === 'lg'
      ? 'h-12 w-12 text-base'
      : size === 'sm'
      ? 'h-7 w-7 text-xs'
      : size === 'xs'
      ? 'h-6 w-6 text-[10.5px]'
      : 'h-9 w-9 text-xs';
  return avatar ? (
    <img
      src={avatar}
      alt={name || 'Avatar'}
      className={`shrink-0 rounded-full border border-white/70 object-cover shadow-xs ${sizeClass}`}
    />
  ) : (
    <div
      className={`dash-avatar-gradient flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-xs ${sizeClass}`}
    >
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}
