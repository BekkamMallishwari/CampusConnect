import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCheck, Sparkles } from 'lucide-react';
import { notificationsApi, type NotificationType } from '../lib/api';
import { getSocket } from '../lib/socket';
import PageTransition from '../components/PageTransition';
import EmptyState from '../components/EmptyState';
import { SectionHeader, NotificationCard, Button } from '../components/ui';

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
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-lg">
          <Sparkles className="text-[var(--primary)]" size={18} />
          <div>
            <p className="text-xs font-bold text-[var(--text)]">{newNotif.title}</p>
            <p className="text-[11px] text-[var(--secondary)]">{newNotif.message}</p>
          </div>
        </div>
      ));
    };

    socket.on('notification:new', handleNewNotification);
    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((notification) => (notification._id === id ? { ...notification, isRead: true } : notification))
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

  const filtered = useMemo(
    () => notifications.filter((notification) => filterType === 'All' || notification.type === filterType),
    [filterType, notifications]
  );

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  return (
    <PageTransition className="space-y-6 py-4 pb-16">
      <SectionHeader
        eyebrow="Notifications"
        title={`Notification Center ${unreadCount ? `(${unreadCount} Unread)` : ''}`}
        description="Real-time match alerts, AI confidence scores, messaging updates, and reward milestones."
        action={
          unreadCount > 0 ? (
            <Button size="sm" variant="secondary" onClick={handleMarkAllRead}>
              <CheckCheck size={14} />
              Mark all read
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap gap-2">
        {['All', 'Match', 'Chat', 'Reward', 'Payment', 'System'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filterType === type
                ? 'bg-[var(--primary)] text-white shadow-xs'
                : 'border border-[var(--border)] bg-[var(--card)] text-[var(--secondary)] hover:bg-[var(--surface)]'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No notifications"
          description={filterType === 'All' ? 'You are all caught up.' : `No ${filterType} notifications found.`}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      )}
    </PageTransition>
  );
}
