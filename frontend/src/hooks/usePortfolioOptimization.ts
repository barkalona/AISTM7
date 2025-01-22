import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useNotifications } from '@/providers/NotificationProvider';

export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';

interface PortfolioWeights {
  [symbol: string]: number;
}

interface OptimizationMetrics {
  expected_return: number;
  volatility: number;
  sharpe_ratio: number;
}

interface EfficientFrontierPoint {
  volatility: number;
  return: number;
}

interface OptimizationResult {
  weights: PortfolioWeights;
  expected_return: number;
  volatility: number;
  sharpe_ratio: number;
  efficient_frontier: [number, number][];  // [volatility, return][]
}

interface OptimizationResponse {
  optimal: OptimizationResult;
  min_risk: OptimizationResult;
  risk_adjusted: OptimizationResult;
}

interface CurrentAllocation {
  portfolio_value: number;
  current_weights: PortfolioWeights;
  metrics: OptimizationMetrics;
}

interface RebalancingTrade {
  [symbol: string]: number;  // Positive for buy, negative for sell
}

export function usePortfolioOptimization() {
  const { data: session } = useSession();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResponse | null>(null);
  const [currentAllocation, setCurrentAllocation] = useState<CurrentAllocation | null>(null);
  const [efficientFrontier, setEfficientFrontier] = useState<EfficientFrontierPoint[]>([]);

  const optimizePortfolio = useCallback(async (
    riskTolerance: RiskTolerance = 'moderate',
    minWeight: number = 0,
    maxWeight: number = 1,
    riskFreeRate: number = 0.02
  ) => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/portfolio/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          risk_tolerance: riskTolerance,
          min_weight: minWeight,
          max_weight: maxWeight,
          risk_free_rate: riskFreeRate
        })
      });

      if (!response.ok) throw new Error('Failed to optimize portfolio');

      const data = await response.json();
      setOptimizationResults(data.data);
    } catch (error) {
      console.error('Error optimizing portfolio:', error);
      addNotification({
        type: 'error',
        title: 'Optimization Error',
        message: 'Failed to optimize portfolio',
        userId: 'system'
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, addNotification]);

  const calculateRebalancing = useCallback(async (
    targetWeights: PortfolioWeights,
    minTradeSize: number = 100
  ) => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/portfolio/rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_weights: targetWeights,
          min_trade_size: minTradeSize
        })
      });

      if (!response.ok) throw new Error('Failed to calculate rebalancing trades');

      const data = await response.json();
      return data.data.required_trades as RebalancingTrade;
    } catch (error) {
      console.error('Error calculating rebalancing trades:', error);
      addNotification({
        type: 'error',
        title: 'Rebalancing Error',
        message: 'Failed to calculate rebalancing trades',
        userId: 'system'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session, addNotification]);

  const fetchEfficientFrontier = useCallback(async (points: number = 50) => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/portfolio/efficient-frontier?points=${points}`);
      if (!response.ok) throw new Error('Failed to fetch efficient frontier');

      const data = await response.json();
      setEfficientFrontier(data.data.efficient_frontier.map(([vol, ret]: [number, number]) => ({
        volatility: vol,
        return: ret
      })));
    } catch (error) {
      console.error('Error fetching efficient frontier:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch efficient frontier',
        userId: 'system'
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, addNotification]);

  const fetchCurrentAllocation = useCallback(async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/portfolio/current-allocation');
      if (!response.ok) throw new Error('Failed to fetch current allocation');

      const data = await response.json();
      setCurrentAllocation(data.data);
    } catch (error) {
      console.error('Error fetching current allocation:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch current allocation',
        userId: 'system'
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, addNotification]);

  // Format optimization results for display
  const formatResults = useCallback((results: OptimizationResponse | null) => {
    if (!results) return null;

    return {
      optimal: {
        weights: Object.entries(results.optimal.weights).map(([symbol, weight]) => ({
          symbol,
          weight: (weight * 100).toFixed(2) + '%'
        })),
        metrics: {
          expectedReturn: (results.optimal.expected_return * 100).toFixed(2) + '%',
          volatility: (results.optimal.volatility * 100).toFixed(2) + '%',
          sharpeRatio: results.optimal.sharpe_ratio.toFixed(2)
        }
      },
      minRisk: {
        weights: Object.entries(results.min_risk.weights).map(([symbol, weight]) => ({
          symbol,
          weight: (weight * 100).toFixed(2) + '%'
        })),
        metrics: {
          expectedReturn: (results.min_risk.expected_return * 100).toFixed(2) + '%',
          volatility: (results.min_risk.volatility * 100).toFixed(2) + '%',
          sharpeRatio: results.min_risk.sharpe_ratio.toFixed(2)
        }
      }
    };
  }, []);

  return {
    isLoading,
    optimizationResults,
    currentAllocation,
    efficientFrontier,
    optimizePortfolio,
    calculateRebalancing,
    fetchEfficientFrontier,
    fetchCurrentAllocation,
    formatResults
  };
}