import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useNotifications } from '@/providers/NotificationProvider';

interface RiskMetrics {
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown: number;
  volatility: number;
  skewness: number;
  kurtosis: number;
  var_metrics: {
    var_amount: number;
    var_percentage: number;
    confidence_level: number;
    time_horizon: number;
  };
  correlation_matrix: Record<string, Record<string, number>>;
  beta: number;
}

interface MonteCarloResults {
  var_amount: number;
  expected_value: number;
  worst_case: number;
  best_case: number;
  percentiles: {
    '5th': number;
    '25th': number;
    '50th': number;
    '75th': number;
    '95th': number;
  };
  simulation_paths: number[][];
}

interface StressTestScenario {
  [symbol: string]: number;  // Percentage change for each symbol
}

interface StressTestResults {
  [scenario: string]: {
    portfolio_value: number;
    change_percentage: number;
  };
}

export function useRiskAnalysis() {
  const { data: session } = useSession();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [monteCarloResults, setMonteCarloResults] = useState<MonteCarloResults | null>(null);
  const [stressTestResults, setStressTestResults] = useState<StressTestResults | null>(null);

  const fetchRiskMetrics = useCallback(async (
    timeHorizon: number = 252,
    confidenceLevel: number = 0.95
  ) => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/risk/metrics?timeHorizon=${timeHorizon}&confidenceLevel=${confidenceLevel}`);
      if (!response.ok) throw new Error('Failed to fetch risk metrics');

      const data = await response.json();
      setRiskMetrics(data.data);
    } catch (error) {
      console.error('Error fetching risk metrics:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch risk metrics',
        userId: 'system'
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, addNotification]);

  const runMonteCarloSimulation = useCallback(async (
    numSimulations: number = 10000,
    timeHorizon: number = 252,
    confidenceLevel: number = 0.95
  ) => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/risk/monte-carlo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numSimulations, timeHorizon, confidenceLevel })
      });

      if (!response.ok) throw new Error('Failed to run Monte Carlo simulation');

      const data = await response.json();
      setMonteCarloResults(data.data);
    } catch (error) {
      console.error('Error running Monte Carlo simulation:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to run Monte Carlo simulation',
        userId: 'system'
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, addNotification]);

  const runStressTest = useCallback(async (scenarios: StressTestScenario[]) => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/risk/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarios })
      });

      if (!response.ok) throw new Error('Failed to run stress test');

      const data = await response.json();
      setStressTestResults(data.data);
    } catch (error) {
      console.error('Error running stress test:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to run stress test',
        userId: 'system'
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, addNotification]);

  const getCorrelationMatrix = useCallback(async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/risk/correlation');
      if (!response.ok) throw new Error('Failed to fetch correlation matrix');

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching correlation matrix:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch correlation matrix',
        userId: 'system'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session, addNotification]);

  // Format risk metrics for display
  const formatMetrics = useCallback((metrics: RiskMetrics | null) => {
    if (!metrics) return null;

    return {
      sharpeRatio: metrics.sharpe_ratio.toFixed(2),
      sortinoRatio: metrics.sortino_ratio.toFixed(2),
      maxDrawdown: (metrics.max_drawdown * 100).toFixed(2) + '%',
      volatility: (metrics.volatility * 100).toFixed(2) + '%',
      valueAtRisk: `$${metrics.var_metrics.var_amount.toLocaleString()} (${metrics.var_metrics.var_percentage.toFixed(2)}%)`,
      beta: metrics.beta.toFixed(2)
    };
  }, []);

  return {
    isLoading,
    riskMetrics,
    monteCarloResults,
    stressTestResults,
    fetchRiskMetrics,
    runMonteCarloSimulation,
    runStressTest,
    getCorrelationMatrix,
    formatMetrics
  };
}