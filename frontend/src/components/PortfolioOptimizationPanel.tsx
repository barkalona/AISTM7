'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { usePortfolioOptimization, RiskTolerance } from '@/hooks/usePortfolioOptimization';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function PortfolioOptimizationPanel() {
  const {
    isLoading,
    optimizationResults,
    currentAllocation,
    efficientFrontier,
    optimizePortfolio,
    fetchEfficientFrontier,
    fetchCurrentAllocation,
    formatResults
  } = usePortfolioOptimization();

  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>('moderate');

  useEffect(() => {
    fetchCurrentAllocation();
    fetchEfficientFrontier();
  }, [fetchCurrentAllocation, fetchEfficientFrontier]);

  const handleOptimize = () => {
    optimizePortfolio(riskTolerance);
  };

  const formattedResults = formatResults(optimizationResults);

  // Prepare chart data
  const chartData = {
    datasets: [
      // Efficient Frontier
      {
        label: 'Efficient Frontier',
        data: efficientFrontier.map(point => ({
          x: point.volatility * 100,
          y: point.return * 100
        })),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        showLine: true,
        fill: false
      },
      // Current Portfolio
      ...(currentAllocation ? [{
        label: 'Current Portfolio',
        data: [{
          x: currentAllocation.metrics.volatility * 100,
          y: currentAllocation.metrics.expected_return * 100
        }],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgb(255, 99, 132)',
        pointRadius: 8
      }] : []),
      // Optimal Portfolio
      ...(optimizationResults ? [{
        label: 'Optimal Portfolio',
        data: [{
          x: optimizationResults.optimal.volatility * 100,
          y: optimizationResults.optimal.expected_return * 100
        }],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgb(54, 162, 235)',
        pointRadius: 8
      }] : [])
    ]
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Portfolio Efficient Frontier'
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const point = context.raw as { x: number; y: number };
            return `Return: ${point.y.toFixed(2)}%, Risk: ${point.x.toFixed(2)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Risk (Volatility) %'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Expected Return %'
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
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Risk Tolerance
            </label>
            <select
              value={riskTolerance}
              onChange={(e) => setRiskTolerance(e.target.value as RiskTolerance)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="conservative">Conservative</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>
          <button
            onClick={handleOptimize}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Optimize Portfolio
          </button>
        </div>
      </div>

      {/* Current Portfolio */}
      {currentAllocation && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Current Portfolio</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Portfolio Value</dt>
              <dd className="text-2xl font-semibold">
                ${currentAllocation.portfolio_value.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Expected Return</dt>
              <dd className="text-2xl font-semibold">
                {(currentAllocation.metrics.expected_return * 100).toFixed(2)}%
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Risk (Volatility)</dt>
              <dd className="text-2xl font-semibold">
                {(currentAllocation.metrics.volatility * 100).toFixed(2)}%
              </dd>
            </div>
          </div>
        </div>
      )}

      {/* Efficient Frontier Chart */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="h-[400px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Optimization Results */}
      {formattedResults && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Optimal Portfolio */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Optimal Portfolio</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Expected Return</dt>
                  <dd className="text-xl font-semibold">{formattedResults.optimal.metrics.expectedReturn}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Risk</dt>
                  <dd className="text-xl font-semibold">{formattedResults.optimal.metrics.volatility}</dd>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Asset Allocation</h4>
                <div className="space-y-2">
                  {formattedResults.optimal.weights.map(({ symbol, weight }) => (
                    <div key={symbol} className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{symbol}</span>
                      <span className="font-medium">{weight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Minimum Risk Portfolio */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Minimum Risk Portfolio</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Expected Return</dt>
                  <dd className="text-xl font-semibold">{formattedResults.minRisk.metrics.expectedReturn}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Risk</dt>
                  <dd className="text-xl font-semibold">{formattedResults.minRisk.metrics.volatility}</dd>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Asset Allocation</h4>
                <div className="space-y-2">
                  {formattedResults.minRisk.weights.map(({ symbol, weight }) => (
                    <div key={symbol} className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{symbol}</span>
                      <span className="font-medium">{weight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}