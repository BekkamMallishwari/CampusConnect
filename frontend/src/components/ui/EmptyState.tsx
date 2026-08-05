import type { ElementType, ReactNode } from 'react';
import { SearchX } from 'lucide-react';

type EmptyStateProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: ElementType;
  className?: string;
};

export function EmptyState({
  title = 'No items found',
  description = 'There are no items matching your criteria at this moment.',
  action,
  icon: Icon = SearchX,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 py-12 text-center shadow-[var(--shadow-xs)] sm:px-10 ${className}`}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[var(--primary)] dark:bg-blue-950/50">
        <Icon size={24} />
      </div>
      <h3 className="text-sm font-bold text-[var(--text)] sm:text-base">{title}</h3>
      <p className="mt-1 max-w-sm text-xs font-normal text-[var(--secondary)] leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
