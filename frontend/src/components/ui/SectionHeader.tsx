import type { ReactNode } from 'react';

type SectionHeaderProps = {
  title?: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({
  title,
  eyebrow,
  description,
  action,
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="space-y-1">
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--secondary)]">
            {eyebrow}
          </p>
        )}
        {title && (
          <h2 className="text-xl font-bold tracking-tight text-[var(--text)] sm:text-2xl">
            {title}
          </h2>
        )}
        {description && (
          <p className="max-w-2xl text-xs text-[var(--secondary)] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
