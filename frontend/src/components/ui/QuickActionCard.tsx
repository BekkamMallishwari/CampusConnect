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
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15 }}
        className="group flex items-center gap-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-xs)] transition-all hover:border-blue-300 hover:shadow-[var(--shadow-md)] dark:hover:border-blue-800"
      >
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg} ${color} transition-transform group-hover:scale-105`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-[var(--text)] truncate group-hover:text-[var(--primary)] transition-colors">
            {title}
          </h4>
          <p className="text-[11px] text-[var(--secondary)] truncate mt-0.5">
            {description}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}
