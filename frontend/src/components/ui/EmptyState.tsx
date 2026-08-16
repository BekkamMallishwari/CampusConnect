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
    <div className={`glass-panel flex flex-col items-center justify-center px-6 py-14 text-center ${className}`}>
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-xs"
        style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px dashed rgba(99, 102, 241, 0.3)' }}
      >
        <Icon size={24} style={{ color: 'var(--dash-accent)' }} />
      </div>
      <h3 className="text-base font-extrabold sm:text-lg" style={{ color: 'var(--dash-text-primary)' }}>
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-xs sm:text-sm font-medium leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default EmptyState;
