import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Bell, Check, Clock } from 'lucide-react';
import { notificationsApi, type NotificationType } from '../lib/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsApi.getAll();
      setNotifications(res.data.notifications);
    } catch (err) {
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      toast.error('Failed to update notification.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error('Failed to clear notifications.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Bell className="text-cyan-400" />
            Notifications
          </h1>
          <p className="mt-2 text-sm text-slate-400">Keep track of item updates, messaging alerts, and reward status</p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs font-bold text-slate-350 hover:border-slate-700 transition"
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-3xl border border-slate-900 bg-slate-900/10 py-20 text-center text-slate-400">
          Your inbox is currently empty.
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => {
            const getLink = () => {
              if (notif.type === 'Match' && notif.relatedId) return `/matches/${notif.relatedId}`;
              if (notif.type === 'Chat') return '/chats';
              if (notif.type === 'Reward') return '/rewards';
              return '/dashboard';
            };

            return (
              <div
                key={notif._id}
                className={`flex items-start justify-between gap-6 rounded-2xl border border-slate-900/80 p-5 transition hover:bg-slate-900/10 ${
                  notif.isRead ? 'bg-slate-950/20' : 'bg-gradient-to-r from-cyan-500/5 to-transparent border-l-4 border-cyan-500 pl-4'
                }`}
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{notif.title}</span>
                    {!notif.isRead && (
                      <span className="h-2 w-2 rounded-full bg-cyan-500 ring-4 ring-cyan-550/15" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{notif.message}</p>
                  <div className="flex items-center gap-4 text-[10px] text-slate-550">
                    <span className="flex items-center gap-1.5">
                      <Clock size={11} /> {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                    <Link to={getLink()} className="font-bold text-cyan-400 hover:text-cyan-300 transition">
                      View Action
                    </Link>
                  </div>
                </div>

                {!notif.isRead && (
                  <button
                    onClick={() => handleMarkRead(notif._id)}
                    className="rounded-full bg-slate-900 p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
