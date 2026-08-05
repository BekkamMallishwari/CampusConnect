import type { ElementType } from 'react';

type MetricCardProps = {
  label: string;
  value: string | number;
  icon?: ElementType;
  color?: string;
  bg?: string;
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  color = 'text-[var(--primary)]',
  bg = 'bg-blue-50 dark:bg-blue-950/40',
}: MetricCardProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5 shadow-[var(--shadow-xs)]">
      <div>
        <p className="text-[11px] font-semibold text-[var(--secondary)]">{label}</p>
        <p className="mt-0.5 text-lg font-bold text-[var(--text)]">
          {value !== undefined && value !== null ? value : 'No data available'}
        </p>
      </div>
      {Icon && (
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg} ${color}`}>
          <Icon size={18} />
        </div>
      )}
    </div>
  );
}
