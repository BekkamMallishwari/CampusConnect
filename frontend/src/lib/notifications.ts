import type { NotificationType } from './api';

export type NotificationGroup = {
  key: string;
  latest: NotificationType;
  items: NotificationType[];
  count: number;
  unreadCount: number;
};

const normalizeText = (value?: string) =>
  (value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export function getNotificationGroupKey(notification: NotificationType) {
  const relatedKey = notification.relatedId ? `${notification.type}:${notification.relatedId}` : '';
  if (relatedKey) return relatedKey;

  const titleKey = normalizeText(notification.title);
  const messageKey = normalizeText(notification.message).slice(0, 90);
  return `${notification.type}:${titleKey}:${messageKey}`;
}

export function groupNotifications(notifications: NotificationType[]) {
  const grouped = new Map<string, NotificationGroup>();

  notifications.forEach((notification) => {
    const key = getNotificationGroupKey(notification);
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        key,
        latest: notification,
        items: [notification],
        count: 1,
        unreadCount: notification.isRead ? 0 : 1,
      });
      return;
    }

    existing.items.push(notification);
    existing.count += 1;
    existing.unreadCount += notification.isRead ? 0 : 1;

    if (new Date(notification.createdAt).getTime() > new Date(existing.latest.createdAt).getTime()) {
      existing.latest = notification;
    }
  });

  return Array.from(grouped.values()).sort(
    (a, b) => new Date(b.latest.createdAt).getTime() - new Date(a.latest.createdAt).getTime(),
  );
}

export function getGroupedUnreadCount(notifications: NotificationType[]) {
  return groupNotifications(notifications).filter((group) => group.unreadCount > 0).length;
}

export function formatGroupedNotificationCount(count: number) {
  if (count <= 1) return '';
  if (count > 99) return '99+';
  return `${count}`;
}
