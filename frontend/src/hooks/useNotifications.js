import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { notificationsAPI } from '../services/api';
import { formatNotificationMessage } from '../utils/formatNotificationMessage';

const POLL_INTERVAL_MS = 30000;

export function useNotifications(user) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const seenIdsRef = useRef(new Set());
  const initialFetchDone = useRef(false);

  const fetchNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!user) return;

    if (!silent) setLoading(true);
    try {
      const { data } = await notificationsAPI.list();
      const items = data.notifications || [];

      if (initialFetchDone.current) {
        const newUnread = items.filter(
          (n) => !n.read && !seenIdsRef.current.has(n._id)
        );
        for (const n of newUnread) {
          toast(`${n.title}\n${formatNotificationMessage(n.message)}`, {
            icon: '🔔',
            duration: 6000,
            style: { maxWidth: '420px', whiteSpace: 'pre-line' }
          });
        }
      }

      items.forEach((n) => seenIdsRef.current.add(n._id));
      initialFetchDone.current = true;

      setNotifications(items);
      setUnreadCount(data.unreadCount ?? items.filter((n) => !n.read).length);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      seenIdsRef.current.clear();
      initialFetchDone.current = false;
      return;
    }

    fetchNotifications();
    const interval = setInterval(() => fetchNotifications({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const markRead = useCallback(async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn('Failed to mark notification read:', err.message);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err.message);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    refresh: fetchNotifications,
    markRead,
    markAllRead
  };
}
