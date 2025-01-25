"use client";

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import DashboardLayout, { DashboardGrid, DashboardCard } from '../../components/DashboardLayout';
import { LoadingButton } from '../../components/Loading';
import { formatCurrency, formatPercentage } from '../../utils/format';
import { useNotifications } from '../../providers/NotificationProvider';

interface PortfolioMetrics {
  totalValue: number;
  dailyChange: number;
  riskScore: number;
  sharpeRatio: number;
  varValue: number;
  topPositions: Array<{
    symbol: string;
    value: number;
    change: number;
  }>;
}

interface RiskMetrics {
  varDaily: number;
  varWeekly: number;
  beta: number;
  volatility: number;
  correlationScore: number;
  stressTestResults: Array<{
    scenario: string;
    impact: number;
  }>;
}

interface AIRecommendation {
  type: string;
  action: string;
  reason: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
}

const DashboardPage = () => {
  const { connected, publicKey } = useWallet();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics | null>(null);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);

  useEffect(() => {
    if (connected && publicKey) {
      fetchDashboardData();
    }
  }, [connected, publicKey]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Simulated data - replace with actual API calls
      const mockPortfolioMetrics: PortfolioMetrics = {
        totalValue: 1234567,
        dailyChange: 0.0234,
        riskScore: 7.2,
        sharpeRatio: 1.8,
        varValue: 45678,
        topPositions: [
          { symbol: 'BTC', value: 234567, change: 0.0345 },
          { symbol: 'ETH', value: 123456, change: -0.0123 },
          { symbol: 'SOL', value: 98765, change: 0.0567 }
        ]
      };

      const mockRiskMetrics: RiskMetrics = {
        varDaily: 23456,
        varWeekly: 52345,
        beta: 1.2,
        volatility: 0.25,
        correlationScore: 0.65,
        stressTestResults: [
          { scenario: 'Market Crash', impact: -0.25 },
          { scenario: 'Interest Rate Hike', impact: -0.15 },
          { scenario: 'Tech Sector Decline', impact: -0.20 }
        ]
      };

      const mockRecommendations: AIRecommendation[] = [
        {
          type: 'Risk Alert',
          action: 'Reduce exposure to tech sector',
          reason: 'High correlation among holdings increases systemic risk',
          impact: 'Potential 15% reduction in portfolio volatility',
          priority: 'high'
        },
        {
          type: 'Optimization',
          action: 'Increase allocation to defensive assets',
          reason: 'Market volatility indicators showing elevated levels',
          impact: 'Expected 10% improvement in risk-adjusted returns',
          priority: 'medium'
        }
      ];

      setPortfolioMetrics(mockPortfolioMetrics);
      setRiskMetrics(mockRiskMetrics);
      setRecommendations(mockRecommendations);
      
      addNotification({
        type: 'success',
        title: 'Dashboard Updated',
        message: 'Latest portfolio data and analysis loaded',
        userId: 'system'
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      addNotification({
        type: 'error',
        title: 'Data Fetch Error',
        message: 'Failed to load dashboard data. Please try again.',
        userId: 'system'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Portfolio Dashboard"
      subtitle="Real-time portfolio analysis and risk metrics"
      loading={loading}
      actions={
        <LoadingButton
          loading={loading}
          onClick={fetchDashboardData}
          variant="outline"
          size="sm"
        >
          Refresh Data
        </LoadingButton>
      }
    >
      <DashboardGrid columns={3}>
        {/* Portfolio Overview */}
        <DashboardCard
          title="Portfolio Overview"
          className="col-span-2"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {portfolioMetrics ? formatCurrency(portfolioMetrics.totalValue) : '-'}
              </p>
              <p className={`text-sm ${
                portfolioMetrics?.dailyChange && portfolioMetrics.dailyChange > 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {portfolioMetrics
                  ? `${formatPercentage(portfolioMetrics.dailyChange)} today`
                  : '-'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Risk Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {portfolioMetrics ? portfolioMetrics.riskScore.toFixed(1) : '-'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">out of 10</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Sharpe Ratio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {portfolioMetrics ? portfolioMetrics.sharpeRatio.toFixed(2) : '-'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">1Y rolling</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Value at Risk</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {portfolioMetrics ? formatCurrency(portfolioMetrics.varValue) : '-'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">95% confidence</p>
            </div>
          </div>
        </DashboardCard>

        {/* AI Recommendations */}
        <DashboardCard
          title="AI Recommendations"
          className="row-span-2"
        >
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border-l-4 border-primary-500"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {rec.type}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    rec.priority === 'high'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      : rec.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {rec.action}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {rec.reason}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Expected Impact: {rec.impact}
                </p>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Risk Analysis */}
        <DashboardCard
          title="Risk Analysis"
          className="col-span-2"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Daily VaR</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {riskMetrics ? formatCurrency(riskMetrics.varDaily) : '-'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Portfolio Beta</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {riskMetrics ? riskMetrics.beta.toFixed(2) : '-'}
                </p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Stress Test Results
              </p>
              <div className="space-y-2">
                {riskMetrics?.stressTestResults.map((result, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {result.scenario}
                    </span>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      {formatPercentage(result.impact)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DashboardCard>
      </DashboardGrid>
    </DashboardLayout>
  );
};

export default DashboardPage;