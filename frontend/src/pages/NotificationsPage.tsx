import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Bell, CheckCheck, MessageSquare, Sparkles, CreditCard, ArrowRight } from 'lucide-react';
import { notificationsApi, type NotificationType } from '../lib/api';
import { getSocket } from '../lib/socket';
import PageTransition from '../components/PageTransition';
import EmptyState from '../components/ui/EmptyState';
import { groupNotifications, type NotificationGroup } from '../lib/notifications';

function GroupedNotificationCard({
  group,
  onMarkRead,
}: {
  group: NotificationGroup;
  onMarkRead: (group: NotificationGroup) => void;
}) {
  const latest = group.latest;
  const isUnread = group.unreadCount > 0;
  const isChat = latest.type === 'Chat';
  const isPayment = latest.type === 'Payment' || latest.type === 'Reward';
  const primaryLabel = isChat && group.count > 1 ? `${group.count} new messages` : latest.title;
  const secondaryLabel =
    isChat && group.count > 1
      ? latest.message
      : group.count > 1
        ? `${group.count} updates grouped together`
        : latest.message;

  return (
    <div
      className={`glass-panel relative overflow-hidden p-4 sm:p-5 transition-all duration-200 hover:shadow-lg ${
        isUnread
          ? 'border-indigo-500/30'
          : ''
      }`}
      style={{
        background: isUnread ? 'rgba(99,102,241,0.06)' : 'var(--glass-bg)',
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3.5">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-xs"
            style={{
              background: isChat
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : isPayment
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            }}
          >
            {isChat ? <MessageSquare size={18} /> : isPayment ? <CreditCard size={18} /> : <Sparkles size={18} />}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-extrabold" style={{ color: 'var(--dash-text-primary)' }}>{primaryLabel}</h3>
              {isUnread && <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />}
              {group.count > 1 && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--dash-accent)' }}>
                  +{group.count}
                </span>
              )}
              {group.unreadCount > 0 && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-black bg-rose-500 text-white">
                  +{group.unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>{secondaryLabel}</p>
            <p className="text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>
              {new Date(latest.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0">
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border" style={{ borderColor: 'var(--glass-border)', color: 'var(--dash-accent)', background: 'rgba(99,102,241,0.08)' }}>
            {latest.type}
          </span>
          <div className="flex items-center gap-2">
            <Link
              to={latest.relatedId ? `/${latest.type === 'Chat' ? 'messages' : 'matches'}/${latest.relatedId}` : '/notifications'}
              className="dash-btn-primary py-1.5 px-3.5 text-xs font-bold shadow-xs"
            >
              <span>Open</span> <ArrowRight size={12} />
            </Link>
            {isUnread && (
              <button
                type="button"
                onClick={() => onMarkRead(group)}
                className="dash-btn-secondary py-1.5 px-3 text-xs font-bold"
              >
                <CheckCheck size={13} />
                <span className="hidden sm:inline">Mark read</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [filterType, setFilterType] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsApi.getAll();
      setNotifications(res.data.notifications || []);
    } catch {
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const socket = getSocket();
    if (!socket) return;

    const handleNewNotification = (newNotif: NotificationType) => {
      setNotifications((prev) => [newNotif, ...prev]);
      toast.custom(() => (
        <div className="glass-panel flex items-center gap-3 p-4 shadow-xl border border-indigo-500/30">
          <Sparkles className="text-indigo-500" size={18} />
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--dash-text-primary)' }}>{newNotif.title}</p>
            <p className="text-[11px]" style={{ color: 'var(--dash-text-secondary)' }}>{newNotif.message}</p>
          </div>
        </div>
      ));
    };

    socket.on('notification:new', handleNewNotification);
    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, []);

  const handleMarkGroupRead = async (group: NotificationGroup) => {
    try {
      await Promise.all(
        group.items
          .filter((notification) => !notification.isRead)
          .map((notification) => notificationsApi.markRead(notification._id))
      );
      setNotifications((prev) =>
        prev.map((notification) =>
          group.items.some((item) => item._id === notification._id) ? { ...notification, isRead: true } : notification
        )
      );
    } catch {
      toast.error('Failed to update notification.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Failed to clear notifications.');
    }
  };

  const grouped = useMemo(() => groupNotifications(notifications), [notifications]);
  const filtered = useMemo(
    () =>
      grouped.filter((group) => filterType === 'All' || group.latest.type === filterType),
    [filterType, grouped]
  );

  const unreadCount = useMemo(
    () => grouped.filter((group) => group.unreadCount > 0).length,
    [grouped]
  );

  return (
    <PageTransition className="space-y-6 py-2 pb-24">
      {/* 1. Hero Glass Banner */}
      <div className="glass-hero-banner relative p-6 sm:p-8">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-xs" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <Bell size={12} /> Notification Center
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight" style={{ color: 'var(--dash-text-primary)' }}>
              Notifications & Alerts {unreadCount > 0 && `(${unreadCount} Unread)`}
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--dash-text-secondary)' }}>
              Live updates on item matches, incoming chat messages, verification status changes, and reward milestones.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="dash-btn-secondary shrink-0 py-2.5 px-4 text-xs font-bold"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {['All', 'Match', 'Chat', 'Reward', 'Payment', 'System'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`glass-tab-pill px-4 py-2 text-xs font-bold ${filterType === type ? 'active' : ''}`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* 3. Notifications List */}
      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No notifications"
          description={filterType === 'All' ? 'You are completely caught up!' : `No ${filterType} notifications found.`}
          icon={Bell}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((group) => (
            <GroupedNotificationCard
              key={group.key}
              group={group}
              onMarkRead={handleMarkGroupRead}
            />
          ))}
        </div>
      )}
    </PageTransition>
  );
}
