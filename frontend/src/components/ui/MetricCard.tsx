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
    <div className="flex items-center justify-between rounded-[1.25rem] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_92%,transparent)] p-3.5 shadow-[var(--shadow-xs)] backdrop-blur-xl">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--secondary)]">{label}</p>
        <p className="mt-1 text-lg font-bold tracking-tight text-[var(--text)]">
          {value !== undefined && value !== null ? value : 'No data available'}
        </p>
      </div>
      {Icon && (
        <div className={`flex h-10 w-10 items-center justify-center rounded-[0.95rem] ${bg} ${color}`}>
          <Icon size={18} />
        </div>
      )}
    </div>
  );
}
