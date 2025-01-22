import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import NotificationSettings from '../page';
import { useNotifications } from '../../../../hooks/useNotifications';
import type { NotificationPreferences } from '../../../../types/notifications';

// Mock the useNotifications hook
jest.mock('../../../../hooks/useNotifications');

const mockPreferences: NotificationPreferences = {
  email: true,
  push: true,
  inApp: true,
  email_enabled: true,
  sms_enabled: false,
  phone: '',
  riskAlerts: true,
  risk_alerts: true,
  anomaly_alerts: true,
  model_alerts: true,
  portfolio_summaries: true,
  tokenRequirements: true,
  systemUpdates: true,
  marketAlerts: true
};

const mockUseNotifications = {
  preferences: mockPreferences,
  updatePreferences: jest.fn(),
  loading: false,
  error: null,
  notifications: [],
  unreadCount: 0,
  addNotification: jest.fn(),
  markAsRead: jest.fn(),
  deleteNotification: jest.fn(),
  clearAll: jest.fn(),
  clearAllNotifications: jest.fn(),
  fetchNotifications: jest.fn(),
  showNotification: jest.fn()
};

describe('NotificationSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNotifications as jest.Mock).mockReturnValue(mockUseNotifications);
  });

  it('renders loading state', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      ...mockUseNotifications,
      loading: true
    });

    render(<NotificationSettings />);
    expect(screen.getByText('Loading notification settings...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const errorMessage = 'Failed to load settings';
    (useNotifications as jest.Mock).mockReturnValue({
      ...mockUseNotifications,
      error: errorMessage
    });

    render(<NotificationSettings />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders all notification preferences correctly', () => {
    render(<NotificationSettings />);

    // Check section headings
    expect(screen.getByText('Delivery Methods')).toBeInTheDocument();
    expect(screen.getByText('Notification Types')).toBeInTheDocument();

    // Check delivery method options
    expect(screen.getByText('Email Notifications')).toBeInTheDocument();
    expect(screen.getByText('SMS Notifications')).toBeInTheDocument();

    // Check notification type options
    expect(screen.getByText('Risk Alerts')).toBeInTheDocument();
    expect(screen.getByText('Anomaly Alerts')).toBeInTheDocument();
    expect(screen.getByText('Model Alerts')).toBeInTheDocument();
    expect(screen.getByText('Portfolio Summaries')).toBeInTheDocument();
  });

  it('initializes form with current preferences', () => {
    render(<NotificationSettings />);

    // Check email notifications checkbox
    const emailCheckbox = screen.getByRole('checkbox', { name: /email notifications/i });
    expect(emailCheckbox).toBeChecked();

    // Check SMS notifications checkbox
    const smsCheckbox = screen.getByRole('checkbox', { name: /sms notifications/i });
    expect(smsCheckbox).not.toBeChecked();
  });

  it('shows phone input field when SMS is enabled', async () => {
    render(<NotificationSettings />);

    // Enable SMS notifications
    const smsCheckbox = screen.getByRole('checkbox', { name: /sms notifications/i });
    fireEvent.click(smsCheckbox);

    // Check if phone input appears
    await waitFor(() => {
      expect(screen.getByPlaceholderText('+1 (555) 555-5555')).toBeInTheDocument();
    });
  });

  it('handles form submission correctly', async () => {
    render(<NotificationSettings />);

    // Modify some settings
    const emailCheckbox = screen.getByRole('checkbox', { name: /email notifications/i });
    fireEvent.click(emailCheckbox);

    const submitButton = screen.getByRole('button', { name: /save preferences/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUseNotifications.updatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({
          email_enabled: false // Changed from true to false
        })
      );
    });
  });

  it('handles phone number input correctly', async () => {
    render(<NotificationSettings />);

    // Enable SMS notifications
    const smsCheckbox = screen.getByRole('checkbox', { name: /sms notifications/i });
    fireEvent.click(smsCheckbox);

    // Enter phone number
    const phoneInput = await screen.findByPlaceholderText('+1 (555) 555-5555');
    fireEvent.change(phoneInput, { target: { value: '+1234567890' } });

    const submitButton = screen.getByRole('button', { name: /save preferences/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUseNotifications.updatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({
          sms_enabled: true,
          phone: '+1234567890'
        })
      );
    });
  });

  it('handles notification type toggles correctly', async () => {
    render(<NotificationSettings />);

    // Toggle risk alerts
    const riskAlertsCheckbox = screen.getByRole('checkbox', { name: /risk alerts/i });
    fireEvent.click(riskAlertsCheckbox);

    // Toggle anomaly alerts
    const anomalyAlertsCheckbox = screen.getByRole('checkbox', { name: /anomaly alerts/i });
    fireEvent.click(anomalyAlertsCheckbox);

    const submitButton = screen.getByRole('button', { name: /save preferences/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUseNotifications.updatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({
          risk_alerts: false,
          anomaly_alerts: false
        })
      );
    });
  });

  it('preserves other preferences when updating specific settings', async () => {
    render(<NotificationSettings />);

    // Change one setting
    const modelAlertsCheckbox = screen.getByRole('checkbox', { name: /model alerts/i });
    fireEvent.click(modelAlertsCheckbox);

    const submitButton = screen.getByRole('button', { name: /save preferences/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUseNotifications.updatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockPreferences,
          model_alerts: false
        })
      );
    });
  });
});