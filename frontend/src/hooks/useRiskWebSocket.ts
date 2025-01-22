import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useNotifications } from '@/providers/NotificationProvider';

export interface RiskMetrics {
  valueAtRisk: number;
  sharpeRatio: number;
  portfolioValue: number;
  monteCarloResults: {
    confidenceIntervals: {
      ninety: number;
      ninetyFive: number;
      ninetyNine: number;
    };
    expectedValue: number;
    worstCase: number;
    bestCase: number;
  };
  assetCorrelations: Array<{
    asset1: string;
    asset2: string;
    correlation: number;
  }>;
  betaMetrics: {
    portfolioBeta: number;
    assetBetas: Array<{
      symbol: string;
      beta: number;
    }>;
  };
  riskBreakdown: {
    systematicRisk: number;
    unsystematicRisk: number;
  };
  timestamp: string;
}

export function useRiskWebSocket(accountId: string) {
  const { data: session } = useSession();
  const { addNotification } = useNotifications();
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!session?.user?.id || !accountId) return;

    // Fetch initial risk metrics
    const fetchRiskMetrics = async () => {
      try {
        const response = await fetch(`/api/risk/metrics/${accountId}`);
        if (!response.ok) throw new Error('Failed to fetch risk metrics');
        const data = await response.json();
        setMetrics(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load risk metrics');
        setLoading(false);
        addNotification({
          type: 'error',
          title: 'Risk Analysis Error',
          message: 'Failed to load risk metrics',
          userId: 'system'
        });
      }
    };

    fetchRiskMetrics();

    // Set up WebSocket connection
    const ws = new WebSocket(
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/risk/live/${accountId}`
    );
    wsRef.current = ws;

    ws.onopen = () => {
      // Request initial update
      ws.send(JSON.stringify({ type: 'requestUpdate' }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'riskUpdate') {
          setMetrics(message.data);
        } else if (message.type === 'error') {
          addNotification({
            type: 'error',
            title: 'Risk Analysis Error',
            message: message.message,
            userId: 'system'
          });
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Lost connection to risk analysis feed',
        userId: 'system'
      });
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [session?.user?.id, accountId, addNotification]);

  // Function to request stress test
  const runStressTest = async (scenarios: any[]) => {
    try {
      const response = await fetch(`/api/risk/stress-test/${accountId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scenarios }),
      });
      if (!response.ok) throw new Error('Failed to run stress test');
      return await response.json();
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Stress Test Error',
        message: 'Failed to run stress test',
        userId: 'system'
      });
      throw err;
    }
  };

  // Function to run Monte Carlo simulation
  const runMonteCarloSimulation = async (simulations = 1000, days = 252) => {
    try {
      const response = await fetch(`/api/risk/monte-carlo/${accountId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ simulations, days }),
      });
      if (!response.ok) throw new Error('Failed to run Monte Carlo simulation');
      return await response.json();
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Simulation Error',
        message: 'Failed to run Monte Carlo simulation',
        userId: 'system'
      });
      throw err;
    }
  };

  // Function to update WebSocket update interval
  const setUpdateInterval = (interval: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'updateInterval',
        interval
      }));
    }
  };

  return {
    metrics,
    loading,
    error,
    runStressTest,
    runMonteCarloSimulation,
    setUpdateInterval
  };
}