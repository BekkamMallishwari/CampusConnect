import { Link } from 'react-router-dom';
import { EmptyState } from './EmptyState';
import { Clock } from 'lucide-react';

type TimelineItem = {
  id: string;
  type: 'lost' | 'found';
  title: string;
  date: string;
  location: string;
};

type TimelineProps = {
  items: TimelineItem[];
};

export function Timeline({ items }: TimelineProps) {
  if (!items || items.length === 0) {
    return (
      <EmptyState
        title="No recent activity yet"
        description="Activity will appear here when items are reported or updated."
        action={
          <Link
            to="/lost-items/new"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[var(--primary-hover)] transition"
          >
            Report an Item
          </Link>
        }
        icon={Clock}
      />
    );
  }

  return (
    <div className="relative space-y-3 pl-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-xs)] transition-colors hover:bg-[var(--surface)]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                item.type === 'lost'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {item.type === 'lost' ? 'L' : 'F'}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-[var(--text)]">{item.title}</p>
              <p className="truncate text-[11px] text-[var(--secondary)]">
                {item.location} • {new Date(item.date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Link
            to={item.type === 'lost' ? `/lost-items/${item.id}` : `/found-items/${item.id}`}
            className="text-xs font-semibold text-[var(--primary)] hover:underline shrink-0"
          >
            View
          </Link>
        </div>
      ))}
    </div>
  );
}
