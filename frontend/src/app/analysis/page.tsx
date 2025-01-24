'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';
import AIAnalysisPanel from '@/components/AIAnalysisPanel';
import { RiskAnalysisPanel } from '@/components/RiskAnalysisPanel';
import CorrelationMatrix from '@/components/CorrelationMatrix';
import { useRiskAnalysis } from '@/hooks/useRiskAnalysis';
import Loader from '@/components/ui/Loader';

type AnalysisTab = 'ai' | 'risk' | 'correlation';

export default function AnalysisPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<AnalysisTab>('ai');
  const { riskMetrics, isLoading } = useRiskAnalysis();

  if (!session) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">
            Please sign in to access portfolio analysis
          </h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Portfolio Analysis</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'ai'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              AI Analysis
            </button>
            <button
              onClick={() => setActiveTab('risk')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'risk'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Risk Analysis
            </button>
            <button
              onClick={() => setActiveTab('correlation')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'correlation'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Correlation Analysis
            </button>
          </div>
        </div>

        {/* Analysis Content */}
        <div className="space-y-8">
          {/* AI Analysis */}
          {activeTab === 'ai' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-medium">AI-Powered Portfolio Analysis</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Advanced analysis using machine learning models to predict market movements,
                    detect anomalies, and analyze market sentiment.
                  </p>
                </div>
                <AIAnalysisPanel />
              </div>
            </div>
          )}

          {/* Risk Analysis */}
          {activeTab === 'risk' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-medium">Portfolio Risk Analysis</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Comprehensive risk metrics including Value at Risk (VaR), volatility,
                    and stress testing scenarios.
                  </p>
                </div>
                <RiskAnalysisPanel />
              </div>
            </div>
          )}

          {/* Correlation Analysis */}
          {activeTab === 'correlation' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-medium">Asset Correlation Analysis</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Visual representation of correlations between different assets in your portfolio,
                    helping identify diversification opportunities.
                  </p>
                </div>
                {isLoading ? (
                  <Loader />
                ) : riskMetrics?.correlation_matrix ? (
                  <CorrelationMatrix data={riskMetrics.correlation_matrix} />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No correlation data available
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analysis Tips */}
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Analysis Tips
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• AI predictions are based on historical data and market patterns</li>
              <li>• Consider multiple analysis methods for a comprehensive view</li>
              <li>• Monitor anomaly detection for unusual market behavior</li>
              <li>• Use correlation analysis to optimize diversification</li>
              <li>• Regularly review and retrain AI models for best results</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}