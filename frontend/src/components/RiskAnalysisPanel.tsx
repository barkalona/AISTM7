'use client';

import { useEffect, useState } from 'react';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { useRiskAnalysis } from '@/hooks/useRiskAnalysis';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function RiskAnalysisPanel() {
  const {
    isLoading,
    riskMetrics,
    monteCarloResults,
    fetchRiskMetrics,
    runMonteCarloSimulation,
    formatMetrics
  } = useRiskAnalysis();

  const [timeHorizon, setTimeHorizon] = useState(252); // 1 year
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);

  useEffect(() => {
    fetchRiskMetrics(timeHorizon, confidenceLevel);
  }, [fetchRiskMetrics, timeHorizon, confidenceLevel]);

  const handleSimulation = () => {
    runMonteCarloSimulation(10000, timeHorizon, confidenceLevel);
  };

  const formattedMetrics = formatMetrics(riskMetrics);

  // Monte Carlo simulation chart data
  const simulationChartData = monteCarloResults ? {
    labels: Array.from({ length: monteCarloResults.simulation_paths[0].length }, (_, i) => i),
    datasets: [
      {
        label: 'Expected Path',
        data: monteCarloResults.simulation_paths[0],
        borderColor: 'rgb(75, 192, 192)',
        fill: false,
      },
      {
        label: '95th Percentile',
        data: monteCarloResults.simulation_paths[Math.floor(monteCarloResults.simulation_paths.length * 0.95)],
        borderColor: 'rgb(255, 99, 132)',
        fill: false,
      },
      {
        label: '5th Percentile',
        data: monteCarloResults.simulation_paths[Math.floor(monteCarloResults.simulation_paths.length * 0.05)],
        borderColor: 'rgb(54, 162, 235)',
        fill: false,
      }
    ]
  } : null;

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monte Carlo Simulation Results'
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Portfolio Value ($)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Days'
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Time Horizon (Days)
          </label>
          <select
            value={timeHorizon}
            onChange={(e) => setTimeHorizon(Number(e.target.value))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value={63}>3 Months</option>
            <option value={126}>6 Months</option>
            <option value={252}>1 Year</option>
            <option value={504}>2 Years</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confidence Level
          </label>
          <select
            value={confidenceLevel}
            onChange={(e) => setConfidenceLevel(Number(e.target.value))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value={0.90}>90%</option>
            <option value={0.95}>95%</option>
            <option value={0.99}>99%</option>
          </select>
        </div>
      </div>

      {/* Risk Metrics */}
      {formattedMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Risk Ratios</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Sharpe Ratio</dt>
                <dd className="text-2xl font-semibold">{formattedMetrics.sharpeRatio}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Sortino Ratio</dt>
                <dd className="text-2xl font-semibold">{formattedMetrics.sortinoRatio}</dd>
              </div>
            </dl>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Risk Metrics</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Value at Risk</dt>
                <dd className="text-2xl font-semibold">{formattedMetrics.valueAtRisk}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Beta</dt>
                <dd className="text-2xl font-semibold">{formattedMetrics.beta}</dd>
              </div>
            </dl>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Volatility Metrics</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Volatility</dt>
                <dd className="text-2xl font-semibold">{formattedMetrics.volatility}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Max Drawdown</dt>
                <dd className="text-2xl font-semibold">{formattedMetrics.maxDrawdown}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Monte Carlo Simulation */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Monte Carlo Simulation</h3>
          <button
            onClick={handleSimulation}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Run Simulation
          </button>
        </div>
        {simulationChartData && (
          <div className="h-[400px]">
            <Line data={simulationChartData} options={chartOptions} />
          </div>
        )}
        {monteCarloResults && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Expected Value</dt>
              <dd className="text-lg font-semibold">${monteCarloResults.expected_value.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">95th Percentile</dt>
              <dd className="text-lg font-semibold">${monteCarloResults.percentiles['95th'].toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">5th Percentile</dt>
              <dd className="text-lg font-semibold">${monteCarloResults.percentiles['5th'].toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">VaR Amount</dt>
              <dd className="text-lg font-semibold">${monteCarloResults.var_amount.toLocaleString()}</dd>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}