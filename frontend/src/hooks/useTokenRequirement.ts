import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useNotifications } from './useNotifications';
import { api } from '../services/api';
import { TokenRequirementNotification, GracePeriodNotification, BaseNotification } from '../types/notifications';

export interface TokenRequirement {
  requirement: number;
  price: number;
  usdValue: number;
  timestamp: number;
  lastUpdate: number;
}

export interface RequirementHistory {
  requirement: number;
  token_price: number;
  usd_target: number;
  timestamp: string;
  reason: string;
}

export interface GracePeriod {
  endDate: string;
  requiredBalance: number;
  initialBalance: number;
  status: string;
}

export interface AccessStatus {
  hasAccess: boolean;
  gracePeriod?: GracePeriod;
}

interface UseTokenRequirementOptions {
  pollingInterval?: number; // milliseconds
  autoRefresh?: boolean;
}

export function useTokenRequirement(options: UseTokenRequirementOptions = {}) {
  const { pollingInterval = 60000, autoRefresh = true } = options;
  const { data: session } = useSession();
  const { addNotification } = useNotifications();

  const [requirement, setRequirement] = useState<TokenRequirement | null>(null);
  const [history, setHistory] = useState<RequirementHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);

  // Fetch current requirement
  const fetchRequirement = useCallback(async () => {
    try {
      const response = await api.get('/token-requirement/current');
      setRequirement(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch token requirement');
      console.error('Error fetching token requirement:', err);
    }
  }, []);

  // Fetch requirement history
  const fetchHistory = useCallback(async (duration: '24h' | '7d' | '30d' = '7d') => {
    try {
      const response = await api.get(`/token-requirement/history?duration=${duration}`);
      setHistory(response.data.history);
      setError(null);
    } catch (err) {
      setError('Failed to fetch requirement history');
      console.error('Error fetching requirement history:', err);
    }
  }, []);

  // Check access status for an address
  const checkAccess = useCallback(async (address: string) => {
    try {
      const response = await api.get(`/token-requirement/check/${address}`);
      setAccessStatus(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      setError('Failed to check access status');
      console.error('Error checking access status:', err);
      return null;
    }
  }, []);

  // Get grace period details
  const getGracePeriod = useCallback(async (userId: string) => {
    if (!session) return null;

    try {
      const response = await api.get(`/token-requirement/grace-period/${userId}`);
      return response.data.gracePeriod;
    } catch (err) {
      console.error('Error fetching grace period:', err);
      return null;
    }
  }, [session]);

  // Admin: Force update requirement
  const forceUpdate = useCallback(async () => {
    if (!session?.user?.isAdmin) {
      throw new Error('Unauthorized');
    }

    try {
      const response = await api.post('/token-requirement/update');
      setRequirement(response.data);
      
      const notification: BaseNotification = {
        type: 'success',
        message: 'Token requirement updated successfully',
        data: {
          currentRequirement: response.data.requirement,
          previousRequirement: requirement?.requirement || 0,
          price: response.data.price,
          usdValue: response.data.usdValue
        }
      };
      
      addNotification(notification);
      return response.data;
    } catch (err) {
      const error = 'Failed to update token requirement';
      setError(error);
      addNotification({
        type: 'error',
        message: error
      });
      throw err;
    }
  }, [session, requirement, addNotification]);

  // Admin: Create grace period
  const createGracePeriod = useCallback(async (userId: string, duration: number) => {
    if (!session?.user?.isAdmin) {
      throw new Error('Unauthorized');
    }

    try {
      const response = await api.post('/token-requirement/grace-period', {
        userId,
        duration
      });

      const gracePeriod = response.data.gracePeriod;
      const notification: BaseNotification = {
        type: 'info',
        message: 'Grace period created successfully',
        data: {
          endDate: gracePeriod.endDate,
          requiredBalance: gracePeriod.requiredBalance,
          currentBalance: gracePeriod.initialBalance,
          hoursRemaining: duration
        }
      };
      
      addNotification(notification);
      return gracePeriod;
    } catch (err) {
      const error = 'Failed to create grace period';
      addNotification({
        type: 'error',
        message: error
      });
      throw err;
    }
  }, [session, addNotification]);

  // Calculate USD value for a token amount
  const calculateUsdValue = useCallback((tokenAmount: number) => {
    if (!requirement) return null;
    return tokenAmount * requirement.price;
  }, [requirement]);

  // Calculate required tokens for a USD value
  const calculateRequiredTokens = useCallback((usdValue: number) => {
    if (!requirement) return null;
    return Math.ceil(usdValue / requirement.price);
  }, [requirement]);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchRequirement(),
          fetchHistory()
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchRequirement, fetchHistory]);

  // Auto-refresh polling
  useEffect(() => {
    if (!autoRefresh) return;

    const pollInterval = setInterval(() => {
      fetchRequirement();
    }, pollingInterval);

    return () => clearInterval(pollInterval);
  }, [autoRefresh, pollingInterval, fetchRequirement]);

  return {
    requirement,
    history,
    loading,
    error,
    accessStatus,
    fetchRequirement,
    fetchHistory,
    checkAccess,
    getGracePeriod,
    forceUpdate,
    createGracePeriod,
    calculateUsdValue,
    calculateRequiredTokens,
  };
}

export default useTokenRequirement;