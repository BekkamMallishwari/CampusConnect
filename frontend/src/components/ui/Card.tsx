import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: boolean;
};

export function Card({ children, className = '', hover = true, padding = true }: CardProps) {
  const base = `rounded-[1.5rem] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_94%,transparent)] backdrop-blur-2xl shadow-[var(--shadow-xs)] transition-all duration-200 ${padding ? 'p-5 sm:p-6' : ''}`;
  const hoverCls = hover ? 'hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] hover:border-[color-mix(in_srgb,var(--primary)_20%,var(--border))]' : '';

  return (
    <motion.div
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={`${base} ${hoverCls} ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between border-b border-[var(--border)] pb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`pt-4 ${className}`}>{children}</div>;
}
