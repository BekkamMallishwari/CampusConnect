import type { ElementType } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

type QuickActionCardProps = {
  title: string;
  description: string;
  to: string;
  icon: ElementType;
  color?: string;
  bg?: string;
};

export function QuickActionCard({
  title,
  description,
  to,
  icon: Icon,
  color = 'text-[var(--primary)]',
  bg = 'bg-blue-50 dark:bg-blue-950/40',
}: QuickActionCardProps) {
  return (
    <Link to={to} className="block">
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ duration: 0.18 }}
        className="group relative flex items-center gap-3.5 overflow-hidden rounded-[1.4rem] border border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_92%,transparent)] p-4 shadow-[var(--shadow-xs)] backdrop-blur-2xl transition-all hover:border-blue-300 hover:shadow-[var(--shadow-lg)] dark:hover:border-blue-800"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.34),transparent_28%)] opacity-80 dark:opacity-20" />
        <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] ${bg} ${color} transition-transform duration-200 group-hover:scale-110`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-bold text-[var(--text)] transition-colors group-hover:text-[var(--primary)]">
            {title}
          </h4>
          <p className="mt-0.5 truncate text-xs text-[var(--secondary)]">
            {description}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}
