import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import NotificationCenter from '../NotificationCenter';
import { useNotifications } from '../../hooks/useNotifications';
import { Notification, NotificationPriority } from '../../types/notifications';

// Mock the useNotifications hook
jest.mock('../../hooks/useNotifications');

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'info',
    title: 'Test Notification',
    message: 'This is a test notification',
    timestamp: Date.now(),
    priority: 'normal' as NotificationPriority,
    read: false
  },
  {
    id: '2',
    type: 'warning',
    message: 'Warning notification without title',
    timestamp: Date.now() - 1000,
    priority: 'high' as NotificationPriority,
    read: true
  }
];

const mockUseNotifications = {
  notifications: mockNotifications,
  loading: false,
  error: null,
  unreadCount: 1,
  markAsRead: jest.fn(),
  deleteNotification: jest.fn(),
  clearAllNotifications: jest.fn(),
  addNotification: jest.fn(),
  updatePreferences: jest.fn(),
  clearAll: jest.fn(),
  fetchNotifications: jest.fn(),
  showNotification: jest.fn(),
  preferences: null
};

describe('NotificationCenter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNotifications as jest.Mock).mockReturnValue(mockUseNotifications);
  });

  it('renders loading state', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      ...mockUseNotifications,
      loading: true
    });

    render(<NotificationCenter />);
    expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const errorMessage = 'Failed to load notifications';
    (useNotifications as jest.Mock).mockReturnValue({
      ...mockUseNotifications,
      error: errorMessage
    });

    render(<NotificationCenter />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      ...mockUseNotifications,
      notifications: []
    });

    render(<NotificationCenter />);
    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });

  it('renders notifications with correct styles and content', () => {
    render(<NotificationCenter />);

    // Check for notification title
    expect(screen.getByText('Test Notification')).toBeInTheDocument();
    
    // Check for notification messages
    expect(screen.getByText('This is a test notification')).toBeInTheDocument();
    expect(screen.getByText('Warning notification without title')).toBeInTheDocument();

    // Check for unread count
    expect(screen.getByText('Notifications (1)')).toBeInTheDocument();
  });

  it('handles mark as read action', async () => {
    render(<NotificationCenter />);

    const markAsReadButton = screen.getByText('Mark as Read');
    fireEvent.click(markAsReadButton);

    expect(mockUseNotifications.markAsRead).toHaveBeenCalledWith('1');
  });

  it('handles delete action', async () => {
    render(<NotificationCenter />);

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(mockUseNotifications.deleteNotification).toHaveBeenCalledWith('1');
  });

  it('handles clear all action', async () => {
    render(<NotificationCenter />);

    const clearAllButton = screen.getByText('Clear All');
    fireEvent.click(clearAllButton);

    expect(mockUseNotifications.clearAllNotifications).toHaveBeenCalled();
  });

  it('applies correct priority styles', () => {
    render(<NotificationCenter />);

    // High priority notification should have red styling
    const highPriorityNotification = screen.getByText('Warning notification without title')
      .closest('div');
    expect(highPriorityNotification).toHaveClass('bg-red-100');

    // Normal priority notification should have blue styling
    const normalPriorityNotification = screen.getByText('This is a test notification')
      .closest('div');
    expect(normalPriorityNotification).toHaveClass('bg-blue-100');
  });

  it('shows timestamps in correct format', () => {
    render(<NotificationCenter />);

    const timestamps = screen.getAllByText(expect.stringMatching(/\d{1,2}\/\d{1,2}\/\d{4}/));
    expect(timestamps).toHaveLength(2);
  });

  it('applies read/unread styling correctly', () => {
    render(<NotificationCenter />);

    const unreadNotification = screen.getByText('This is a test notification')
      .closest('div');
    const readNotification = screen.getByText('Warning notification without title')
      .closest('div');

    expect(readNotification).toHaveClass('opacity-75');
    expect(unreadNotification).not.toHaveClass('opacity-75');
  });

  it('shows mark as read button only for unread notifications', () => {
    render(<NotificationCenter />);

    const markAsReadButtons = screen.getAllByText('Mark as Read');
    expect(markAsReadButtons).toHaveLength(1);
  });
});