import { Link } from 'react-router-dom';
import { Sparkles, MessageSquare, Gift, CreditCard, ShieldCheck, Clock, ArrowRight, X } from 'lucide-react';
import type { NotificationType } from '../../lib/api';

type NotificationCardProps = {
  notification: NotificationType;
  onMarkRead?: (id: string) => void;
};

export function NotificationCard({ notification, onMarkRead }: NotificationCardProps) {
  const isMatch = notification.type === 'Match';
  const matchConfidence = notification.message.match(/(\d+)%/)?.[1] || '85';

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
        className={`group relative overflow-hidden rounded-xl border transition-all p-5 ${
          !notification.isRead
            ? 'border-blue-300 bg-gradient-to-r from-blue-50/80 via-[var(--card)] to-[var(--card)] shadow-sm dark:border-blue-800 dark:from-blue-950/30'
            : 'border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-xs)]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-xs">
              <Sparkles size={20} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-[var(--text)]">Possible Match Found</h4>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-extrabold text-[var(--primary)] dark:bg-blue-950 dark:text-blue-300">
                  AI Confidence {matchConfidence}%
                </span>
                {!notification.isRead && (
                  <span className="h-2 w-2 rounded-full bg-[var(--primary)] animate-pulse" />
                )}
              </div>
              <p className="text-xs text-[var(--secondary)] leading-relaxed">{notification.message}</p>
              <p className="inline-flex items-center gap-1 text-[10px] text-[var(--secondary)] pt-0.5 opacity-80">
                <Clock size={11} />
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
            <Link
              to={notification.relatedId ? `/matches/${notification.relatedId}` : '/matches'}
              onClick={() => !notification.isRead && onMarkRead?.(notification._id)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[var(--primary-hover)] transition"
            >
              Review Match <ArrowRight size={13} />
            </Link>

            {!notification.isRead && onMarkRead && (
              <button
                onClick={() => onMarkRead(notification._id)}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-semibold text-[var(--secondary)] hover:bg-[var(--surface)] transition"
              >
                <X size={13} /> Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        !notification.isRead
          ? 'border-blue-200 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-950/20'
          : 'border-[var(--border)] bg-[var(--card)]'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)]">
          {iconForType(notification.type)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-[var(--text)]">{notification.title}</h4>
            {!notification.isRead && <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />}
          </div>
          <p className="mt-0.5 text-xs text-[var(--secondary)] leading-relaxed">{notification.message}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-[var(--secondary)] opacity-80">
            <Clock size={11} />
            {new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>

        {!notification.isRead && onMarkRead && (
          <button
            onClick={() => onMarkRead(notification._id)}
            className="text-xs font-semibold text-[var(--primary)] hover:underline shrink-0"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
