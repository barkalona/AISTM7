import React, { useEffect } from 'react';
import { useNotifications } from '../providers/NotificationProvider';
import Notification from './Notification';
import { Notification as NotificationType } from '../types/alerts';

const AlertManager: React.FC = () => {
  const { notifications, dismissNotification, snoozeNotification } = useNotifications();

  // Poll for new alerts every minute
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/alerts');
        if (!response.ok) throw new Error('Failed to fetch alerts');
        
        const alerts = await response.json();
        // Process new alerts here if needed
      } catch (error) {
        console.error('Error polling alerts:', error);
      }
    }, 60000);

    return () => clearInterval(pollInterval);
  }, []);

  // Filter out snoozed notifications
  const activeNotifications = notifications.filter(
    (notification: NotificationType) => 
      !notification.snoozedUntil || notification.snoozedUntil < Date.now()
  );

  return (
    <div className="fixed top-4 right-4 z-50 w-96 space-y-4">
      {activeNotifications.map((notification: NotificationType) => (
        <Notification
          key={notification.id}
          notification={notification}
          onDismiss={dismissNotification}
          onSnooze={snoozeNotification}
        />
      ))}
    </div>
  );
};

export default AlertManager;