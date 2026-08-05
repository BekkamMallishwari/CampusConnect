import { motion, type MotionProps } from 'framer-motion';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type PortalTone = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

const toneClasses: Record<PortalTone, string> = {
  primary: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  secondary: 'border-[var(--border)] bg-[var(--surface)] text-[var(--secondary)]',
  accent: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
  neutral: 'border-[var(--border)] bg-[var(--card)] text-[var(--text)]',
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-0.5">
            {eyebrow && <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--secondary)]">{eyebrow}</p>}
            {title && <h2 className="text-xl font-bold tracking-tight text-[var(--text)] sm:text-2xl">{title}</h2>}
            {description && <p className="max-w-3xl text-xs text-[var(--secondary)] leading-relaxed">{description}</p>}
          </div>
          {action}
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
  const base = `overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-xs)] transition-all duration-200 hover:shadow-[var(--shadow-md)]`;
  if (!animate) return <div className={`${base} ${className}`}>{children}</div>;
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
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
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${portalToneClass(tone)} ${className}`}
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
    primary: 'bg-[var(--primary)] text-white shadow-xs hover:bg-[var(--primary-hover)]',
    secondary: 'border border-[var(--border)] bg-[var(--card)] text-[var(--text)] hover:bg-[var(--surface)]',
    danger: 'bg-red-600 text-white shadow-xs hover:bg-red-700',
    success: 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${variants[variant]} ${className}`}
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
    <PortalCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--secondary)]">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-[var(--text)]">{value}</p>
          {delta && <p className="text-xs font-medium text-[var(--secondary)]">{delta}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${portalToneClass(tone)}`}>
          {icon}
        </div>
      </div>
    </PortalCard>
  );
}

export function PortalInput({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-xs text-[var(--text)] outline-none transition placeholder:text-[var(--placeholder)] focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-500/10 ${className}`}
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
      className={`w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-xs text-[var(--text)] outline-none transition placeholder:text-[var(--placeholder)] focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-500/10 ${className}`}
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
      className={`h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-xs text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-500/10 ${className}`}
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
      ? 'bg-red-500'
      : tone === 'accent'
      ? 'bg-cyan-500'
      : 'bg-[var(--primary)]';

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface)]">
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

export function getStatusTone(status?: string) {
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
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass = size === 'lg' ? 'h-12 w-12 text-base' : size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-xs';
  return avatar ? (
    <img src={avatar} alt={name || 'Avatar'} className={`shrink-0 rounded-lg object-cover ${sizeClass}`} />
  ) : (
    <div className={`flex shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] font-bold text-white ${sizeClass}`}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}
