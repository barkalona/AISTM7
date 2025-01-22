import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../useNotifications';
import { api } from '../../services/api';
import type { Notification, NotificationPreferences } from '../../types/notifications';

// Mock the API module
jest.mock('../../services/api', () => ({
  get: jest.fn(),
  put: jest.fn(),
  post: jest.fn(),
  delete: jest.fn()
}));

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 'test-user-id' } },
    status: 'authenticated'
  })
}));

// Mock WebSocket
class MockWebSocket {
  onmessage: ((event: MessageEvent) => void) | null = null;
  close = jest.fn();
  constructor(public url: string) {}
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'info',
    message: 'Test notification',
    timestamp: Date.now(),
    read: false
  },
  {
    id: '2',
    type: 'warning',
    message: 'Another notification',
    timestamp: Date.now() - 1000,
    read: true
  }
];

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

describe('useNotifications', () => {
  let mockWs: MockWebSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock WebSocket constructor
    mockWs = new MockWebSocket('ws://test');
    (global as any).WebSocket = jest.fn(() => mockWs);

    // Mock API responses
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/notifications') {
        return Promise.resolve({ data: mockNotifications });
      }
      if (url === '/notifications/preferences') {
        return Promise.resolve({ data: mockPreferences });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useNotifications());

    expect(result.current.notifications).toEqual([]);
    expect(result.current.preferences).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.unreadCount).toBe(0);
  });

  it('fetches notifications and preferences on mount', async () => {
    const { result } = renderHook(() => useNotifications());

    // Wait for the initial data fetch
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.notifications).toEqual(mockNotifications);
    expect(result.current.preferences).toEqual(mockPreferences);
    expect(result.current.loading).toBe(false);
    expect(result.current.unreadCount).toBe(1);
  });

  it('handles addNotification correctly', async () => {
    const { result } = renderHook(() => useNotifications());

    // Wait for initial data fetch
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const newNotification = {
      type: 'success' as const,
      message: 'New notification'
    };

    act(() => {
      result.current.addNotification(newNotification);
    });

    expect(result.current.notifications[0]).toMatchObject({
      ...newNotification,
      read: false
    });
  });

  it('handles markAsRead correctly', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      await result.current.markAsRead('1');
    });

    expect(api.put).toHaveBeenCalledWith('/notifications/1/read');
    expect(result.current.notifications.find((n: Notification) => n.id === '1')?.read).toBe(true);
  });

  it('handles deleteNotification correctly', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      await result.current.deleteNotification('1');
    });

    expect(api.delete).toHaveBeenCalledWith('/notifications/1');
    expect(result.current.notifications.find((n: Notification) => n.id === '1')).toBeUndefined();
  });

  it('handles clearAll correctly', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      await result.current.clearAll();
    });

    expect(api.delete).toHaveBeenCalledWith('/notifications');
    expect(result.current.notifications).toHaveLength(0);
  });

  it('handles clearAllNotifications as an alias for clearAll', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      await result.current.clearAllNotifications();
    });

    expect(api.delete).toHaveBeenCalledWith('/notifications');
    expect(result.current.notifications).toHaveLength(0);
  });

  it('handles updatePreferences correctly', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const newPreferences = {
      ...mockPreferences,
      email_enabled: false
    };

    await act(async () => {
      await result.current.updatePreferences(newPreferences);
    });

    expect(api.put).toHaveBeenCalledWith('/notifications/preferences', newPreferences);
    expect(result.current.preferences).toEqual(newPreferences);
  });

  it('calculates unreadCount correctly', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.unreadCount).toBe(1);

    await act(async () => {
      await result.current.markAsRead('1');
    });

    expect(result.current.unreadCount).toBe(0);
  });

  it('handles showNotification correctly', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      result.current.showNotification('success', 'Test message', { test: true });
    });

    expect(result.current.notifications[0]).toMatchObject({
      type: 'success',
      message: 'Test message',
      data: { test: true },
      read: false
    });
  });

  it('handles API errors gracefully', async () => {
    const errorMessage = 'Failed to fetch';
    (api.get as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('Failed to fetch notifications');
    expect(result.current.loading).toBe(false);
  });

  it('handles WebSocket notifications', async () => {
    const { result } = renderHook(() => useNotifications());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const mockWsNotification: Notification = {
      id: '3',
      type: 'info',
      message: 'WebSocket notification',
      timestamp: Date.now(),
      read: false
    };

    // Wait for WebSocket setup
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Simulate WebSocket message
    act(() => {
      if (mockWs.onmessage) {
        mockWs.onmessage(new MessageEvent('message', {
          data: JSON.stringify(mockWsNotification)
        }));
      }
    });

    expect(result.current.notifications).toContainEqual(mockWsNotification);
  });
});