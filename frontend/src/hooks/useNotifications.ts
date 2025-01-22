import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '../services/api';
import {
  Notification,
  NotificationPreferences,
  NotificationHookReturn,
  NotificationType,
  BaseNotification
} from '../types/notifications';

// Re-export types for convenience
export type { Notification, NotificationPreferences };

export function useNotifications(): NotificationHookReturn {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate unread count
  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read).length,
  [notifications]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    }
  }, [session?.user?.id]);

  // Add new notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // If it's a persistent notification, send it to the server
    if (notification.type !== 'success') {
      api.post('/notifications', newNotification).catch(err => {
        console.error('Failed to persist notification:', err);
      });
    }
  }, []);

  // Update notification preferences
  const updatePreferences = useCallback(async (newPreferences: NotificationPreferences) => {
    if (!session?.user?.id) return;

    try {
      await api.put('/notifications/preferences', newPreferences);
      setPreferences(newPreferences);
      setError(null);
    } catch (err) {
      setError('Failed to update notification preferences');
      throw err;
    }
  }, [session?.user?.id]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!session?.user?.id) return;

    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      setError(null);
    } catch (err) {
      setError('Failed to mark notification as read');
      throw err;
    }
  }, [session?.user?.id]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!session?.user?.id) return;

    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );
      setError(null);
    } catch (err) {
      setError('Failed to delete notification');
      throw err;
    }
  }, [session?.user?.id]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      await api.delete('/notifications');
      setNotifications([]);
      setError(null);
    } catch (err) {
      setError('Failed to clear notifications');
      throw err;
    }
  }, [session?.user?.id]);

  // Alias for clearAll to match interface
  const clearAllNotifications = clearAll;

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await api.get('/notifications/preferences');
      setPreferences(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch notification preferences');
      console.error('Error fetching preferences:', err);
    }
  }, [session?.user?.id]);

  // Helper function to show a notification
  const showNotification = useCallback((type: NotificationType, message: string, data?: any) => {
    const notification: BaseNotification = {
      type,
      message,
      data
    };
    addNotification(notification);
  }, [addNotification]);

  // Initial data fetch
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchNotifications(),
          fetchPreferences()
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.user?.id, fetchNotifications, fetchPreferences]);

  // WebSocket subscription for real-time notifications
  useEffect(() => {
    if (!session?.user?.id) return;

    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/notifications`);

    ws.onmessage = (event) => {
      const notification: Notification = JSON.parse(event.data);
      setNotifications(prev => [notification, ...prev]);
    };

    return () => {
      ws.close();
    };
  }, [session?.user?.id]);

  return {
    notifications,
    preferences,
    loading,
    error,
    unreadCount,
    addNotification,
    updatePreferences,
    markAsRead,
    deleteNotification,
    clearAll,
    clearAllNotifications,
    fetchNotifications,
    showNotification
  };
}

export default useNotifications;