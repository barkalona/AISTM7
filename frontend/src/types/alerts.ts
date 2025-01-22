export type NotificationType = 'error' | 'warning' | 'success' | 'info';

export interface BaseNotification {
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

export interface Notification extends BaseNotification {
  id: string;
  createdAt: number;
  snoozedUntil?: number;
  userId: string;
  thresholdId?: string;
  portfolioId?: string;
  metadata?: {
    [key: string]: any;
  };
}

export type AlertType = 'risk_level' | 'portfolio_value' | 'volatility';
export type AlertCondition = 'above' | 'below';

export interface CreateAlertInput {
  type: AlertType;
  threshold: number;
  condition: AlertCondition;
  portfolioId?: string;
  notificationChannels?: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  frequency?: {
    type: 'immediate' | 'daily' | 'weekly';
    time?: string;
    days?: number[];
  };
}

export interface AlertThreshold {
  id: string;
  userId: string;
  portfolioId: string;
  type: AlertType;
  threshold: number;
  condition: AlertCondition;
  enabled: boolean;
  notificationChannels: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  frequency: {
    type: 'immediate' | 'daily' | 'weekly';
    time?: string; // For scheduled notifications
    days?: number[]; // For weekly notifications (0-6, where 0 is Sunday)
  };
  createdAt: number;
  updatedAt: number;
}

export interface NotificationPreferences {
  userId: string;
  channels: {
    email: {
      enabled: boolean;
      address: string;
    };
    sms: {
      enabled: boolean;
      phoneNumber: string;
    };
    inApp: {
      enabled: boolean;
      desktop: boolean;
      mobile: boolean;
    };
  };
  schedules: {
    dailySummary: {
      enabled: boolean;
      time: string; // 24-hour format, e.g., "09:00"
    };
    weeklySummary: {
      enabled: boolean;
      day: number; // 0-6, where 0 is Sunday
      time: string;
    };
  };
  riskAlerts: {
    enabled: boolean;
    thresholds: {
      high: number;
      medium: number;
      low: number;
    };
  };
}

export interface UpdateAlertInput extends Partial<CreateAlertInput> {
  enabled?: boolean;
}