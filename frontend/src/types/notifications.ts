import React from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationPriority = 'high' | 'normal' | 'low';

export interface BaseNotification {
  type: NotificationType;
  title?: string;
  message: string;
  priority?: NotificationPriority;
  data?: any;
}

export interface Notification extends BaseNotification {
  id: string;
  timestamp: number;
  read?: boolean;
}

export interface NotificationPreferences {
  // Core preferences
  email: boolean;
  push: boolean;
  inApp: boolean;
  
  // Legacy preferences (for backward compatibility)
  email_enabled: boolean;
  sms_enabled: boolean;
  phone?: string;
  
  // Alert types
  riskAlerts: boolean;
  risk_alerts: boolean;
  anomaly_alerts: boolean;
  model_alerts: boolean;
  portfolio_summaries: boolean;
  tokenRequirements: boolean;
  systemUpdates: boolean;
  marketAlerts: boolean;
}

export interface NotificationHookReturn {
  preferences: NotificationPreferences | null;
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  updatePreferences: (newPreferences: NotificationPreferences) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  showNotification: (type: NotificationType, message: string, data?: any) => void;
}

export interface NotificationProviderProps {
  children: React.ReactNode;
}

export interface NotificationContextValue {
  preferences: NotificationPreferences | null;
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  updatePreferences: (newPreferences: NotificationPreferences) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  showNotification: (type: NotificationType, message: string, data?: any) => void;
}

export interface NotificationComponentProps {
  notification: Notification;
  onClose?: () => void;
}

// Token requirement specific notifications
export interface TokenRequirementNotification extends Notification {
  data: {
    currentRequirement: number;
    previousRequirement: number;
    price: number;
    usdValue: number;
    gracePeriodHours?: number;
    currentBalance?: number;
  };
}

export interface GracePeriodNotification extends Notification {
  data: {
    endDate: string;
    requiredBalance: number;
    currentBalance: number;
    hoursRemaining: number;
  };
}

// Notification service types
export interface NotificationService {
  send: (notification: BaseNotification) => Promise<void>;
  getPreferences: (userId: string) => Promise<NotificationPreferences>;
  updatePreferences: (userId: string, preferences: NotificationPreferences) => Promise<void>;
  markAsRead: (userId: string, notificationId: string) => Promise<void>;
  deleteNotification: (userId: string, notificationId: string) => Promise<void>;
  clearAll: (userId: string) => Promise<void>;
  getNotifications: (userId: string) => Promise<Notification[]>;
}

// WebSocket notification types
export interface NotificationWebSocketMessage {
  type: 'notification';
  data: Notification;
}

export interface NotificationSubscription {
  userId: string;
  preferences: NotificationPreferences;
}

// Notification queue types
export interface NotificationQueueItem {
  notification: BaseNotification;
  userId: string;
  retryCount?: number;
  priority?: NotificationPriority;
}

// Batch notification types
export interface BatchNotification {
  notifications: BaseNotification[];
  userIds: string[];
  groupId?: string;
}

// Notification template types
export interface NotificationTemplate {
  type: NotificationType;
  messageTemplate: string;
  category: string;
  preferenceKey: keyof NotificationPreferences;
}

// Notification analytics types
export interface NotificationAnalytics {
  totalSent: number;
  readRate: number;
  clickThroughRate: number;
  categoryBreakdown: Record<string, number>;
  deliveryStats: {
    success: number;
    failed: number;
    pending: number;
  };
}

// Priority styling map
export const PRIORITY_STYLES: Record<NotificationPriority, string> = {
  high: 'bg-red-100 border-red-400 text-red-800',
  normal: 'bg-blue-100 border-blue-400 text-blue-800',
  low: 'bg-gray-100 border-gray-400 text-gray-800'
};