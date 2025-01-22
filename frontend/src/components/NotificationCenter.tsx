import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { PRIORITY_STYLES, NotificationPriority } from '../types/notifications';

const NotificationCenter: React.FC = () => {
  const {
    notifications,
    loading,
    error,
    markAsRead,
    deleteNotification,
    clearAllNotifications,
    unreadCount
  } = useNotifications();

  if (loading) {
    return <div className="p-4">Loading notifications...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  const getPriorityStyle = (priority: NotificationPriority = 'normal'): string => {
    return PRIORITY_STYLES[priority];
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4 p-4 bg-white shadow rounded">
        <h2 className="text-lg font-semibold">
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </h2>
        {notifications.length > 0 && (
          <button
            onClick={() => clearAllNotifications()}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear All
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No notifications
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg shadow border ${getPriorityStyle(notification.priority)} ${
                notification.read ? 'opacity-75' : ''
              }`}
            >
              {notification.title && (
                <h3 className="font-semibold mb-1">{notification.title}</h3>
              )}
              <p className="text-sm">{notification.message}</p>
              
              <div className="mt-2 flex justify-between items-center text-xs">
                <span className="text-gray-500">
                  {new Date(notification.timestamp).toLocaleString()}
                </span>
                <div className="space-x-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;