import React from 'react';
import { Notification as NotificationType } from '../types/alerts';

interface NotificationProps {
  notification: NotificationType;
  onDismiss: (id: string) => void;
  onSnooze: (id: string, duration: number) => void;
}

const Notification: React.FC<NotificationProps> = ({
  notification,
  onDismiss,
  onSnooze,
}) => {
  const { id, title, message, type, createdAt, snoozedUntil } = notification;

  // Don't show snoozed notifications
  if (snoozedUntil && snoozedUntil > new Date().getTime()) {
    return null;
  }

  const getSeverityColor = () => {
    switch (type) {
      case 'error':
        return 'bg-red-100 border-red-500 text-red-900';
      case 'warning':
        return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      case 'success':
        return 'bg-green-100 border-green-500 text-green-900';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-900';
    }
  };

  return (
    <div
      className={`${getSeverityColor()} border-l-4 p-4 mb-4 rounded-r shadow-md`}
      role="alert"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold mb-1">{title}</h3>
          <p className="text-sm">{message}</p>
          <p className="text-xs mt-1 opacity-75">
            {new Date(createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onSnooze(id, 30)} // Snooze for 30 minutes
            className="text-sm px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            Snooze
          </button>
          <button
            onClick={() => onDismiss(id)}
            className="text-sm px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;