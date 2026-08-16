import type { ElementType } from 'react';
import { motion } from 'framer-motion';

type StatsCardProps = {
  label: string;
  value: string | number;
  icon?: ElementType;
  description?: string;
  trend?: string;
  color?: string;
  bg?: string;
  onClick?: () => void;
  className?: string;
};

export function StatsCard({
  label,
  value,
  icon: Icon,
  description,
  trend,
  color = 'text-[var(--primary)]',
  bg = 'bg-blue-50 dark:bg-blue-950/40',
  onClick,
  className = '',
}: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.18 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_92%,transparent)] p-4 shadow-[var(--shadow-xs)] backdrop-blur-2xl transition-all hover:shadow-[var(--shadow-lg)] ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_32%)] opacity-70 dark:opacity-20" />
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-50" />
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--secondary)]">{label}</p>
          <p className="text-3xl font-black tracking-tight text-[var(--text)] sm:text-[2.15rem]">
            {value !== undefined && value !== null ? value : 'No data available'}
          </p>
          {(description || trend) && (
            <p className="text-sm leading-6 text-[var(--secondary)]">
              {description || trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-white/40 ${bg} ${color} shadow-[0_16px_30px_rgba(15,23,42,0.12)]`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
