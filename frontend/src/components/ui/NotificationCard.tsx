import { Link } from 'react-router-dom';
import { Sparkles, MessageSquare, Gift, CreditCard, ShieldCheck, Clock, ArrowRight, X } from 'lucide-react';
import type { NotificationType } from '../../lib/api';

type NotificationCardProps = {
  notification: NotificationType;
  onMarkRead?: (id: string) => void;
  count?: number;
  unreadCount?: number;
};

export function NotificationCard({ notification, onMarkRead, count = 1, unreadCount = 0 }: NotificationCardProps) {
  const isMatch = notification.type === 'Match';
  const matchConfidence = notification.message.match(/(\d+)%/)?.[1] || '85';
  const displayCount = count > 1 ? `${count}` : '';
  const unreadLabel = unreadCount > 1 ? `${unreadCount}` : unreadCount === 1 ? '1' : '';

  const iconForType = (type: string) => {
    switch (type) {
      case 'Match':
        return <Sparkles size={18} className="text-[var(--primary)]" />;
      case 'Chat':
        return <MessageSquare size={18} className="text-blue-500" />;
      case 'Reward':
        return <Gift size={18} className="text-emerald-500" />;
      case 'Payment':
        return <CreditCard size={18} className="text-amber-500" />;
      default:
        return <ShieldCheck size={18} className="text-[var(--secondary)]" />;
    }
  };

  if (isMatch) {
    return (
      <div
        className={`group relative overflow-hidden rounded-[1.5rem] border transition-all p-5 shadow-[var(--shadow-xs)] backdrop-blur-2xl ${
          !notification.isRead
            ? 'border-blue-300 bg-gradient-to-r from-blue-50/80 via-[var(--card)] to-[var(--card)] dark:border-blue-800 dark:from-blue-950/30'
            : 'border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_94%,transparent)]'
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.34),transparent_30%)] opacity-80 dark:opacity-20" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-xs">
              <Sparkles size={20} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[var(--text)]">Possible Match Found</h4>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-extrabold text-[var(--primary)] dark:bg-blue-950 dark:text-blue-300">
                  AI Confidence {matchConfidence}%
                </span>
                {!notification.isRead && (
                  <span className="h-2 w-2 rounded-full bg-[var(--primary)] animate-pulse" />
                )}
              </div>
              <p className="text-sm text-[var(--secondary)] leading-relaxed">{notification.message}</p>
              <p className="inline-flex items-center gap-1 text-[11px] text-[var(--secondary)] pt-0.5 opacity-80">
                <Clock size={11} />
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
            <Link
              to={notification.relatedId ? `/matches/${notification.relatedId}` : '/matches'}
              onClick={() => !notification.isRead && onMarkRead?.(notification._id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white shadow-[0_16px_36px_rgba(79,70,229,0.24)] transition hover:-translate-y-0.5 hover:bg-[var(--primary-hover)]"
            >
              Review Match <ArrowRight size={13} />
            </Link>

            {!notification.isRead && onMarkRead && (
              <button
                onClick={() => onMarkRead(notification._id)}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-semibold text-[var(--secondary)] transition hover:bg-[var(--surface)]"
              >
                <X size={13} /> Dismiss
              </button>
            )}
          </div>
        </div>
        {(displayCount || unreadLabel) && (
          <div className="absolute right-4 top-4 flex items-center gap-2">
            {displayCount && (
              <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-[10px] font-black text-[var(--text)]">
                +{displayCount}
              </span>
            )}
            {unreadLabel && (
              <span className="rounded-full bg-[var(--danger)] px-2.5 py-1 text-[10px] font-black text-white">
                {unreadLabel}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-[1.4rem] border p-4 transition-all shadow-[var(--shadow-xs)] backdrop-blur-2xl ${
        !notification.isRead
          ? 'border-blue-200 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-950/20'
          : 'border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_94%,transparent)]'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] bg-[var(--surface)]">
          {iconForType(notification.type)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-[var(--text)]">{notification.title}</h4>
            {!notification.isRead && <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />}
            {count > 1 && (
              <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] font-black text-[var(--text)]">
                +{count}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-[var(--secondary)] leading-relaxed">{notification.message}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--secondary)] opacity-80">
            <Clock size={11} />
            {new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>

        {!notification.isRead && onMarkRead && (
          <button
            onClick={() => onMarkRead(notification._id)}
            className="shrink-0 text-sm font-semibold text-[var(--primary)] hover:underline"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
