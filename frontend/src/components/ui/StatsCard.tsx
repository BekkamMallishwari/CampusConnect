import type { ElementType } from 'react';
import { motion } from 'framer-motion';

type StatsCardProps = {
  label: string;
  value: string | number;
  icon?: ElementType;
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
  trend,
  color = 'text-[var(--primary)]',
  bg = 'bg-blue-50 dark:bg-blue-950/40',
  onClick,
  className = '',
}: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={`rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-xs)] transition-all hover:shadow-[var(--shadow-md)] ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[var(--secondary)]">{label}</p>
          <p className="text-2xl font-black text-[var(--text)] tracking-tight">
            {value !== undefined && value !== null ? value : 'No data available'}
          </p>
          {trend && (
            <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              {trend}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg} ${color}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
