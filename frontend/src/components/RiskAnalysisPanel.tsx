import React, { useEffect, useState } from 'react';
import { useRiskAnalysis } from '@/hooks/useRiskAnalysis';
import RiskChart from './RiskChart';
import CorrelationMatrix from './CorrelationMatrix';
import Loader from './ui/Loader';

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

export const RiskAnalysisPanel: React.FC = () => {
  const [timeHorizon, setTimeHorizon] = useState(252);
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);
  const [selectedDistribution, setSelectedDistribution] = useState<'normal' | 't_dist' | 'gmm'>('normal');
  
  const {
    isLoading,
    riskMetrics,
    monteCarloResults,
    fetchRiskMetrics,
    runMonteCarloSimulation,
    formatMetrics
  } = useRiskAnalysis();

  useEffect(() => {
    fetchRiskMetrics(timeHorizon, confidenceLevel);
    runMonteCarloSimulation(10000, timeHorizon, confidenceLevel);
  }, [timeHorizon, confidenceLevel, fetchRiskMetrics, runMonteCarloSimulation]);

  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);

  if (isLoading) return <Loader />;
  if (!riskMetrics || !monteCarloResults) return null;

  const formattedMetrics = formatMetrics(riskMetrics);
  if (!formattedMetrics) return null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Portfolio Risk Analysis</h2>
        <div className="space-x-4">
          <select
            value={timeHorizon}
            onChange={(e) => setTimeHorizon(Number(e.target.value))}
            className="rounded border p-2"
          >
            <option value={21}>1 Month</option>
            <option value={63}>3 Months</option>
            <option value={126}>6 Months</option>
            <option value={252}>1 Year</option>
          </select>
          <select
            value={confidenceLevel}
            onChange={(e) => setConfidenceLevel(Number(e.target.value))}
            className="rounded border p-2"
          >
            <option value={0.90}>90%</option>
            <option value={0.95}>95%</option>
            <option value={0.99}>99%</option>
          </select>
          <button
            onClick={() => {
              fetchRiskMetrics(timeHorizon, confidenceLevel);
              runMonteCarloSimulation(10000, timeHorizon, confidenceLevel);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Key Risk Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-xl font-semibold mb-4">Key Risk Metrics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Sharpe Ratio</span>
              <span className="font-mono">{formattedMetrics.sharpeRatio}</span>
            </div>
            <div className="flex justify-between">
              <span>Sortino Ratio</span>
              <span className="font-mono">{formattedMetrics.sortinoRatio}</span>
            </div>
            <div className="flex justify-between">
              <span>Beta</span>
              <span className="font-mono">{formattedMetrics.beta}</span>
            </div>
            <div className="flex justify-between">
              <span>Volatility (Annualized)</span>
              <span className="font-mono">{formattedMetrics.volatility}</span>
            </div>
            <div className="flex justify-between">
              <span>Maximum Drawdown</span>
              <span className="font-mono text-red-500">{formattedMetrics.maxDrawdown}</span>
            </div>
            <div className="flex justify-between">
              <span>Value at Risk</span>
              <span className="font-mono text-red-500">{formattedMetrics.valueAtRisk}</span>
            </div>
          </div>
        </div>

        {/* Monte Carlo Results */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-xl font-semibold mb-4">Monte Carlo Simulation</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Expected Value</span>
              <span className="font-mono">
                {formatCurrency(monteCarloResults.expected_value)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>VaR ({confidenceLevel * 100}%)</span>
              <span className="font-mono text-red-500">
                {formatCurrency(monteCarloResults.var_amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Worst Case</span>
              <span className="font-mono text-red-500">
                {formatCurrency(monteCarloResults.worst_case)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Best Case</span>
              <span className="font-mono text-green-500">
                {formatCurrency(monteCarloResults.best_case)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monte Carlo Simulation Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-xl font-semibold mb-4">Portfolio Value Distribution</h3>
        <RiskChart
          simulationPaths={monteCarloResults.simulation_paths}
          percentiles={monteCarloResults.percentiles}
          timeHorizon={timeHorizon}
        />
      </div>

      {/* Correlation Matrix */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h3 className="text-xl font-semibold mb-4">Asset Correlations</h3>
        <CorrelationMatrix data={riskMetrics.correlation_matrix} />
      </div>
    </div>
  );
};