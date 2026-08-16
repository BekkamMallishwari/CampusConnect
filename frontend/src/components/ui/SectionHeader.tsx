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
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="space-y-1">
        {eyebrow && (
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--secondary)]">
            {eyebrow}
          </p>
        )}
        {title && (
          <h2 className="text-2xl font-black tracking-tight text-[var(--text)] sm:text-[2rem]">
            {title}
          </h2>
        )}
        {description && (
          <p className="max-w-2xl text-sm text-[var(--secondary)] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
