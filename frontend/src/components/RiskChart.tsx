'use client';

import { useEffect, useMemo, useState } from 'react';
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
  RadialLinearScale,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Radar } from 'react-chartjs-2';
import { useRiskWebSocket } from '@/hooks/useRiskWebSocket';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface RiskChartProps {
  accountId: string;
}

export default function RiskChart({ accountId }: RiskChartProps) {
  const { metrics, loading, error, runMonteCarloSimulation } = useRiskWebSocket(accountId);
  const [monteCarloData, setMonteCarloData] = useState<any>(null);

  useEffect(() => {
    // Run Monte Carlo simulation when component mounts
    const runSimulation = async () => {
      try {
        const data = await runMonteCarloSimulation(1000, 252);
        setMonteCarloData(data);
      } catch (error) {
        console.error('Failed to run Monte Carlo simulation:', error);
      }
    };
    runSimulation();
  }, [runMonteCarloSimulation]);

  const riskBreakdownData = useMemo(() => ({
    labels: ['Systematic Risk', 'Unsystematic Risk'],
    datasets: [
      {
        data: metrics ? [
          metrics.riskBreakdown.systematicRisk,
          metrics.riskBreakdown.unsystematicRisk
        ] : [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)'
        ],
        borderWidth: 1,
      },
    ],
  }), [metrics]);

  const betaData = useMemo(() => ({
    labels: metrics?.betaMetrics.assetBetas.map(b => b.symbol) || [],
    datasets: [
      {
        label: 'Asset Betas',
        data: metrics?.betaMetrics.assetBetas.map(b => b.beta) || [],
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  }), [metrics]);

  const correlationData = useMemo(() => {
    if (!metrics?.assetCorrelations) return null;

    const uniqueAssets = new Set<string>();
    metrics.assetCorrelations.forEach(corr => {
      uniqueAssets.add(corr.asset1);
      uniqueAssets.add(corr.asset2);
    });

    const labels = Array.from(uniqueAssets);
    const correlationMatrix = Array(labels.length).fill(0).map(() => Array(labels.length).fill(1));

    metrics.assetCorrelations.forEach(corr => {
      const i = labels.indexOf(corr.asset1);
      const j = labels.indexOf(corr.asset2);
      correlationMatrix[i][j] = corr.correlation;
      correlationMatrix[j][i] = corr.correlation;
    });

    return {
      labels,
      datasets: labels.map((label, i) => ({
        label,
        data: correlationMatrix[i],
        backgroundColor: `hsla(${(i * 360) / labels.length}, 70%, 50%, 0.8)`,
        borderColor: `hsla(${(i * 360) / labels.length}, 70%, 50%, 1)`,
      })),
    };
  }, [metrics]);

  const monteCarloChartData = useMemo(() => {
    if (!monteCarloData) return null;

    return {
      labels: ['Current', '1 Year Forecast'],
      datasets: [
        {
          label: 'Expected Value',
          data: [metrics?.portfolioValue, monteCarloData.expectedValue],
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
        },
        {
          label: '90% Confidence',
          data: [metrics?.portfolioValue, monteCarloData.confidenceIntervals.ninety],
          borderColor: 'rgba(255, 206, 86, 1)',
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
        },
        {
          label: '95% Confidence',
          data: [metrics?.portfolioValue, monteCarloData.confidenceIntervals.ninetyFive],
          borderColor: 'rgba(255, 159, 64, 1)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
        },
        {
          label: '99% Confidence',
          data: [metrics?.portfolioValue, monteCarloData.confidenceIntervals.ninetyNine],
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
        },
      ],
    };
  }, [metrics, monteCarloData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Key Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Value at Risk (95%)</h3>
          <p className="text-3xl font-bold text-blue-600">
            {metrics ? (metrics.valueAtRisk * 100).toFixed(2) + '%' : '-'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Sharpe Ratio</h3>
          <p className="text-3xl font-bold text-green-600">
            {metrics ? metrics.sharpeRatio.toFixed(2) : '-'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Portfolio Beta</h3>
          <p className="text-3xl font-bold text-purple-600">
            {metrics ? metrics.betaMetrics.portfolioBeta.toFixed(2) : '-'}
          </p>
        </div>
      </div>

      {/* Risk Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Risk Breakdown</h3>
          <div className="h-64">
            <Bar
              data={riskBreakdownData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                  title: {
                    display: true,
                    text: 'Systematic vs Unsystematic Risk',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                      callback: value => value + '%',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Asset Betas */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Asset Betas</h3>
          <div className="h-64">
            <Bar
              data={betaData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                  title: {
                    display: true,
                    text: 'Individual Asset Betas',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Monte Carlo Simulation */}
      {monteCarloChartData && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Monte Carlo Simulation</h3>
          <div className="h-96">
            <Line
              data={monteCarloChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: '1 Year Portfolio Value Forecast',
                  },
                },
                scales: {
                  y: {
                    ticks: {
                      callback: value => '$' + value.toLocaleString(),
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Correlation Matrix */}
      {correlationData && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Asset Correlations</h3>
          <div className="h-96">
            <Radar
              data={correlationData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Asset Correlation Matrix',
                  },
                },
                scales: {
                  r: {
                    min: -1,
                    max: 1,
                    ticks: {
                      stepSize: 0.2,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}