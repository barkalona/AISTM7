'use client';

import { useEffect, useState } from 'react';
import { useRiskWebSocket } from '@/hooks/useRiskWebSocket';
import { useNotifications } from '@/providers/NotificationProvider';

interface Recommendation {
  type: 'rebalance' | 'risk' | 'opportunity';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const DEFAULT_STRESS_SCENARIOS = [
  {
    name: 'Market Crash',
    description: 'Simulates a severe market downturn',
    factors: {
      stocks: 0.7, // -30%
      bonds: 0.9, // -10%
      crypto: 0.5, // -50%
      commodities: 0.8 // -20%
    }
  },
  {
    name: 'Inflation Surge',
    description: 'Simulates high inflation environment',
    factors: {
      stocks: 0.85,
      bonds: 0.8,
      crypto: 0.9,
      commodities: 1.2
    }
  },
  {
    name: 'Tech Bubble',
    description: 'Simulates tech sector collapse',
    factors: {
      stocks: 0.6,
      bonds: 1.05,
      crypto: 0.4,
      commodities: 1.1
    }
  }
];

interface RecommendationPanelProps {
  accountId: string;
}

export default function RecommendationPanel({ accountId }: RecommendationPanelProps) {
  const { metrics, loading, error, runStressTest } = useRiskWebSocket(accountId);
  const { addNotification } = useNotifications();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    if (!metrics) return;

    const newRecommendations: Recommendation[] = [];

    // Check portfolio beta
    if (metrics.betaMetrics.portfolioBeta > 1.2) {
      newRecommendations.push({
        type: 'risk',
        priority: 'high',
        title: 'High Portfolio Beta',
        description: 'Your portfolio is more volatile than the market. Consider reducing exposure to high-beta assets.',
        action: {
          label: 'View High Beta Assets',
          onClick: () => {
            const highBetaAssets = metrics.betaMetrics.assetBetas
              .filter(asset => asset.beta > 1.2)
              .map(asset => asset.symbol)
              .join(', ');
            addNotification({
              type: 'info',
              title: 'High Beta Assets',
              message: `Assets to review: ${highBetaAssets}`,
              userId: 'system'
            });
          }
        }
      });
    }

    // Check Value at Risk
    if (metrics.valueAtRisk > 0.15) { // 15% VaR threshold
      newRecommendations.push({
        type: 'risk',
        priority: 'high',
        title: 'High Value at Risk',
        description: 'Your portfolio has a high risk of significant losses. Consider diversifying or hedging positions.',
        action: {
          label: 'Run Stress Test',
          onClick: async () => {
            try {
              const results = await runStressTest(DEFAULT_STRESS_SCENARIOS);
              addNotification({
                type: 'info',
                title: 'Stress Test Results',
                message: `Worst case scenario: ${results[0].impact}`,
                userId: 'system'
              });
            } catch (error) {
              console.error('Stress test failed:', error);
            }
          }
        }
      });
    }

    // Check Sharpe Ratio
    if (metrics.sharpeRatio < 0.5) {
      newRecommendations.push({
        type: 'rebalance',
        priority: 'medium',
        title: 'Low Risk-Adjusted Returns',
        description: 'Your portfolio\'s risk-adjusted returns are below optimal levels. Consider rebalancing to improve efficiency.',
      });
    }

    // Check systematic vs unsystematic risk
    if (metrics.riskBreakdown.unsystematicRisk > 60) {
      newRecommendations.push({
        type: 'rebalance',
        priority: 'medium',
        title: 'High Unsystematic Risk',
        description: 'Your portfolio has high company-specific risk. Consider increasing diversification.',
      });
    }

    // Check correlation clusters
    const highCorrelations = metrics.assetCorrelations.filter(corr => corr.correlation > 0.8);
    if (highCorrelations.length > 0) {
      newRecommendations.push({
        type: 'risk',
        priority: 'medium',
        title: 'High Asset Correlation',
        description: 'Several assets in your portfolio are highly correlated, reducing diversification benefits.',
        action: {
          label: 'View Correlations',
          onClick: () => {
            const correlatedPairs = highCorrelations
              .map(corr => `${corr.asset1} - ${corr.asset2}`)
              .join('\n');
            addNotification({
              type: 'info',
              title: 'Highly Correlated Assets',
              message: `Review these pairs:\n${correlatedPairs}`,
              userId: 'system'
            });
          }
        }
      });
    }

    // Monte Carlo simulation insights
    if (metrics.monteCarloResults.confidenceIntervals.ninetyFive < metrics.portfolioValue) {
      newRecommendations.push({
        type: 'risk',
        priority: 'high',
        title: 'Negative Growth Outlook',
        description: 'Monte Carlo simulations suggest a high probability of portfolio value decline.',
      });
    }

    setRecommendations(newRecommendations);
  }, [metrics, addNotification, runStressTest]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-lg">
        Failed to load recommendations: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">AI Recommendations</h2>
      
      {recommendations.length === 0 ? (
        <div className="text-gray-500 italic">
          No recommendations at this time. Your portfolio appears to be well-balanced.
        </div>
      ) : (
        <div className="grid gap-4">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                rec.priority === 'high'
                  ? 'border-red-200 bg-red-50'
                  : rec.priority === 'medium'
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-blue-200 bg-blue-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold mb-1">{rec.title}</h3>
                  <p className="text-sm text-gray-600">{rec.description}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    rec.type === 'risk'
                      ? 'bg-red-100 text-red-800'
                      : rec.type === 'rebalance'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {rec.type}
                </span>
              </div>
              
              {rec.action && (
                <button
                  onClick={rec.action.onClick}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {rec.action.label} →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}