"use client";

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import DashboardLayout, { DashboardGrid, DashboardCard } from '../../components/DashboardLayout';
import { LoadingButton } from '../../components/Loading';
import { formatCurrency, formatPercentage } from '../../utils/format';
import { useNotifications } from '../../providers/NotificationProvider';

interface RiskAnalysis {
  valueAtRisk: {
    daily: number;
    weekly: number;
    monthly: number;
    confidence: number;
  };
  metrics: {
    sharpeRatio: number;
    sortinoRatio: number;
    beta: number;
    alpha: number;
    rSquared: number;
    informationRatio: number;
    treynorRatio: number;
    trackingError: number;
  };
  stressTests: Array<{
    scenario: string;
    impact: number;
    probability: number;
    description: string;
  }>;
  correlations: Array<{
    asset1: string;
    asset2: string;
    correlation: number;
    strength: 'strong' | 'moderate' | 'weak';
  }>;
  riskFactors: Array<{
    factor: string;
    exposure: number;
    contribution: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
}

const RiskAnalysisPage = () => {
  const { connected, publicKey } = useWallet();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M'>('1D');

  useEffect(() => {
    if (connected && publicKey) {
      fetchRiskAnalysis();
    }
  }, [connected, publicKey, timeframe]);

  const fetchRiskAnalysis = async () => {
    try {
      setLoading(true);
      
      // Simulated data - replace with actual API calls
      const mockAnalysis: RiskAnalysis = {
        valueAtRisk: {
          daily: 45678,
          weekly: 98765,
          monthly: 156789,
          confidence: 0.95
        },
        metrics: {
          sharpeRatio: 1.8,
          sortinoRatio: 2.1,
          beta: 1.2,
          alpha: 0.03,
          rSquared: 0.85,
          informationRatio: 0.75,
          treynorRatio: 0.12,
          trackingError: 0.04
        },
        stressTests: [
          {
            scenario: 'Market Crash',
            impact: -0.25,
            probability: 0.05,
            description: 'Simulates a sudden market downturn similar to 2008'
          },
          {
            scenario: 'Interest Rate Hike',
            impact: -0.15,
            probability: 0.15,
            description: 'Models impact of a 100 basis point rate increase'
          },
          {
            scenario: 'Tech Sector Decline',
            impact: -0.20,
            probability: 0.10,
            description: 'Simulates tech sector correction'
          }
        ],
        correlations: [
          {
            asset1: 'BTC',
            asset2: 'ETH',
            correlation: 0.85,
            strength: 'strong'
          },
          {
            asset1: 'SOL',
            asset2: 'ETH',
            correlation: 0.75,
            strength: 'strong'
          },
          {
            asset1: 'BTC',
            asset2: 'SOL',
            correlation: 0.65,
            strength: 'moderate'
          }
        ],
        riskFactors: [
          {
            factor: 'Market Risk',
            exposure: 0.45,
            contribution: 0.35,
            trend: 'increasing'
          },
          {
            factor: 'Volatility Risk',
            exposure: 0.30,
            contribution: 0.25,
            trend: 'stable'
          },
          {
            factor: 'Liquidity Risk',
            exposure: 0.25,
            contribution: 0.20,
            trend: 'decreasing'
          }
        ]
      };

      setAnalysis(mockAnalysis);
      
      addNotification({
        type: 'success',
        title: 'Analysis Updated',
        message: 'Risk analysis data refreshed successfully',
        userId: 'system'
      });
    } catch (error) {
      console.error('Error fetching risk analysis:', error);
      addNotification({
        type: 'error',
        title: 'Analysis Error',
        message: 'Failed to update risk analysis. Please try again.',
        userId: 'system'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderMetricCard = (title: string, value: number | string, subtitle?: string) => (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {typeof value === 'number' ? value.toFixed(2) : value}
      </p>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      )}
    </div>
  );

  return (
    <DashboardLayout
      title="Risk Analysis"
      subtitle="Comprehensive portfolio risk assessment and stress testing"
      loading={loading}
      actions={
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg p-1">
            {(['1D', '1W', '1M'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timeframe === t
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <LoadingButton
            loading={loading}
            onClick={fetchRiskAnalysis}
            variant="outline"
            size="sm"
          >
            Refresh Analysis
          </LoadingButton>
        </div>
      }
    >
      <DashboardGrid columns={2}>
        {/* Value at Risk */}
        <DashboardCard title="Value at Risk">
          <div className="grid grid-cols-3 gap-4">
            {analysis && (
              <>
                {renderMetricCard(
                  'Daily VaR',
                  formatCurrency(analysis.valueAtRisk.daily),
                  `${formatPercentage(analysis.valueAtRisk.confidence)} confidence`
                )}
                {renderMetricCard(
                  'Weekly VaR',
                  formatCurrency(analysis.valueAtRisk.weekly),
                  `${formatPercentage(analysis.valueAtRisk.confidence)} confidence`
                )}
                {renderMetricCard(
                  'Monthly VaR',
                  formatCurrency(analysis.valueAtRisk.monthly),
                  `${formatPercentage(analysis.valueAtRisk.confidence)} confidence`
                )}
              </>
            )}
          </div>
        </DashboardCard>

        {/* Risk Metrics */}
        <DashboardCard title="Risk Metrics">
          <div className="grid grid-cols-4 gap-4">
            {analysis && (
              <>
                {renderMetricCard('Sharpe Ratio', analysis.metrics.sharpeRatio)}
                {renderMetricCard('Sortino Ratio', analysis.metrics.sortinoRatio)}
                {renderMetricCard('Beta', analysis.metrics.beta)}
                {renderMetricCard('Alpha', formatPercentage(analysis.metrics.alpha))}
              </>
            )}
          </div>
        </DashboardCard>

        {/* Stress Tests */}
        <DashboardCard title="Stress Test Scenarios">
          <div className="space-y-4">
            {analysis?.stressTests.map((test, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {test.scenario}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {test.description}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    {formatPercentage(test.impact)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Probability
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPercentage(test.probability)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Risk Factors */}
        <DashboardCard title="Risk Factor Analysis">
          <div className="space-y-4">
            {analysis?.riskFactors.map((factor, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {factor.factor}
                  </h4>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      factor.trend === 'increasing'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : factor.trend === 'decreasing'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}
                  >
                    {factor.trend}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Exposure
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatPercentage(factor.exposure)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Risk Contribution
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatPercentage(factor.contribution)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </DashboardGrid>
    </DashboardLayout>
  );
};

export default RiskAnalysisPage;