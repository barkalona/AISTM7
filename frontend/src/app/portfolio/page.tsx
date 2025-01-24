'use client';

import { useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSession } from 'next-auth/react';
import { usePortfolioWebSocket } from '@/hooks/usePortfolioWebSocket';
import { useRiskAnalysis } from '@/hooks/useRiskAnalysis';
import DashboardLayout from '@/components/DashboardLayout';
import RiskChart from '@/components/RiskChart';
import RecommendationPanel from '@/components/RecommendationPanel';
import { calculateAssetAllocation } from '@/types/portfolio';
import { TokenGate } from '@/components/TokenGate';

function PortfolioContent() {
  const { publicKey } = useWallet();
  const { data: session } = useSession();
  const { positions, loading: positionsLoading, error: positionsError } = usePortfolioWebSocket();
  const { 
    monteCarloResults,
    isLoading: riskLoading,
    runMonteCarloSimulation
  } = useRiskAnalysis();

  useEffect(() => {
    if (session?.user?.id) {
      runMonteCarloSimulation(10000, 252, 0.95);
    }
  }, [session?.user?.id, runMonteCarloSimulation]);

  const totalValue = useMemo(() => 
    positions.reduce((sum, pos) => sum + pos.value, 0),
    [positions]
  );

  const assetAllocation = useMemo(() => 
    calculateAssetAllocation(positions),
    [positions]
  );

  if (!session || !publicKey) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">
          Please connect your wallet and sign in to view your portfolio
        </h2>
      </div>
    );
  }

  if (positionsLoading || riskLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (positionsError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{positionsError}</div>
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
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Value</h3>
          <p className="text-3xl font-bold text-blue-600">
            ${totalValue.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Number of Positions</h3>
          <p className="text-3xl font-bold text-green-600">
            {positions.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Asset Classes</h3>
          <p className="text-3xl font-bold text-purple-600">
            {assetAllocation.length}
          </p>
        </div>
      </div>

      {/* Risk Analysis */}
      <TokenGate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Charts */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Risk Analysis</h2>
            {monteCarloResults && (
              <RiskChart
                simulationPaths={monteCarloResults.simulation_paths}
                percentiles={monteCarloResults.percentiles}
                timeHorizon={252}
              />
            )}
          </div>

          {/* AI Recommendations */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <RecommendationPanel accountId={session.user.id} />
          </div>
        </div>
      </TokenGate>

      {/* Position Details */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Positions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">24h Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {positions.map((position) => (
                <tr key={position.contractId}>
                  <td className="px-6 py-4">{position.symbol}</td>
                  <td className="px-6 py-4">{position.assetClass}</td>
                  <td className="px-6 py-4">{position.quantity}</td>
                  <td className="px-6 py-4">{formatCurrency(position.value)}</td>
                  <td className="px-6 py-4">{formatPercentage(position.allocation)}</td>
                  <td className={`px-6 py-4 ${
                    position.change24h > 0 
                      ? 'text-green-600' 
                      : position.change24h < 0 
                      ? 'text-red-600' 
                      : ''
                  }`}>
                    {formatPercentage(position.change24h)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  return (
    <DashboardLayout>
      <PortfolioContent />
    </DashboardLayout>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}