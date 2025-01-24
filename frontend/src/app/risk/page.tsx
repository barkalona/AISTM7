'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';
import { RiskAnalysisPanel } from '@/components/RiskAnalysisPanel';
import CorrelationMatrix from '@/components/CorrelationMatrix';
import { useRiskAnalysis } from '@/hooks/useRiskAnalysis';
import { usePortfolioWebSocket } from '@/hooks/usePortfolioWebSocket';
import Loader from '@/components/ui/Loader';

type TabType = 'metrics' | 'correlation' | 'stress';

const DEFAULT_SCENARIOS = [
  {
    name: 'Market Crash',
    changes: {
      'SPY': -30,
      'QQQ': -35,
      'AAPL': -40,
      'MSFT': -38,
      'GOOGL': -37
    }
  },
  {
    name: 'Tech Selloff',
    changes: {
      'SPY': -10,
      'QQQ': -25,
      'AAPL': -30,
      'MSFT': -28,
      'GOOGL': -27
    }
  },
  {
    name: 'Interest Rate Hike',
    changes: {
      'SPY': -15,
      'QQQ': -20,
      'AAPL': -18,
      'MSFT': -17,
      'GOOGL': -19
    }
  }
];

export default function RiskPage() {
  const { data: session } = useSession();
  const { positions } = usePortfolioWebSocket();
  const { 
    runStressTest, 
    stressTestResults, 
    isLoading,
    riskMetrics
  } = useRiskAnalysis();
  const [activeTab, setActiveTab] = useState<TabType>('metrics');
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [customScenario, setCustomScenario] = useState<Record<string, number>>({});

  const handleStressTest = (scenario: typeof DEFAULT_SCENARIOS[0]) => {
    setSelectedScenario(scenario.name);
    runStressTest([scenario.changes]);
  };

  const handleCustomScenario = () => {
    if (Object.keys(customScenario).length === 0) return;
    runStressTest([customScenario]);
  };

  const updateCustomScenario = (symbol: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      const newScenario = { ...customScenario };
      delete newScenario[symbol];
      setCustomScenario(newScenario);
    } else {
      setCustomScenario({ ...customScenario, [symbol]: numValue });
    }
  };

  if (!session) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">
            Please sign in to access risk analysis
          </h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-8">Portfolio Risk Analysis</h1>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`${
                activeTab === 'metrics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Risk Metrics
            </button>
            <button
              onClick={() => setActiveTab('correlation')}
              className={`${
                activeTab === 'correlation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Correlation Analysis
            </button>
            <button
              onClick={() => setActiveTab('stress')}
              className={`${
                activeTab === 'stress'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Stress Testing
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'metrics' && <RiskAnalysisPanel />}
          
          {activeTab === 'correlation' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Asset Correlations</h2>
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
          )}
          
          {activeTab === 'stress' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Stress Testing</h2>

              {/* Predefined Scenarios */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {DEFAULT_SCENARIOS.map((scenario) => (
                  <button
                    key={scenario.name}
                    onClick={() => handleStressTest(scenario)}
                    className={`p-4 rounded-lg border-2 ${
                      selectedScenario === scenario.name
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <h3 className="font-medium mb-2">{scenario.name}</h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-300">
                      {Object.entries(scenario.changes).map(([symbol, change]) => (
                        <li key={symbol}>
                          {symbol}: {change > 0 ? '+' : ''}{change}%
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              {/* Custom Scenario */}
              <div className="mb-6">
                <h3 className="font-medium mb-4">Custom Scenario</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {positions.map((position) => (
                    <div key={position.symbol}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {position.symbol}
                      </label>
                      <input
                        type="number"
                        value={customScenario[position.symbol] || ''}
                        onChange={(e) => updateCustomScenario(position.symbol, e.target.value)}
                        placeholder="% change"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleCustomScenario}
                  disabled={Object.keys(customScenario).length === 0 || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
                >
                  Run Custom Scenario
                </button>
              </div>

              {/* Results */}
              {stressTestResults && (
                <div className="mt-6">
                  <h3 className="font-medium mb-4">Stress Test Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(stressTestResults).map(([scenario, result]) => (
                      <div
                        key={scenario}
                        className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                      >
                        <h4 className="font-medium mb-2">
                          {scenario === 'scenario_1' ? selectedScenario || 'Custom Scenario' : scenario}
                        </h4>
                        <dl className="grid grid-cols-2 gap-4">
                          <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Portfolio Value</dt>
                            <dd className="text-lg font-semibold">
                              ${result.portfolio_value.toLocaleString()}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm text-gray-500 dark:text-gray-400">Change</dt>
                            <dd className={`text-lg font-semibold ${
                              result.change_percentage > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {result.change_percentage > 0 ? '+' : ''}
                              {result.change_percentage.toFixed(2)}%
                            </dd>
                          </div>
                        </dl>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}