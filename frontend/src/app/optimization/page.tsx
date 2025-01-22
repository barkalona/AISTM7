'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';
import PortfolioOptimizationPanel from '@/components/PortfolioOptimizationPanel';
import { usePortfolioOptimization } from '@/hooks/usePortfolioOptimization';
import { usePortfolioWebSocket } from '@/hooks/usePortfolioWebSocket';
import { RebalancingTrade, calculateRebalancingTrades } from '@/types/portfolio';

export default function OptimizationPage() {
  const { data: session } = useSession();
  const { positions } = usePortfolioWebSocket();
  const { calculateRebalancing, optimizationResults, currentAllocation } = usePortfolioOptimization();
  const [rebalancingTrades, setRebalancingTrades] = useState<RebalancingTrade[]>([]);

  const handleRebalance = async () => {
    if (!optimizationResults?.optimal.weights || !currentAllocation) return;

    const trades = await calculateRebalancing(
      optimizationResults.optimal.weights,
      100  // Minimum trade size of $100
    );

    if (!trades) return;

    // Convert trades to RebalancingTrade format
    const formattedTrades = Object.entries(trades).map(([symbol, amount]) => ({
      symbol,
      amount: Math.abs(amount),
      type: amount > 0 ? 'buy' : 'sell'
    } as RebalancingTrade));

    setRebalancingTrades(formattedTrades);
  };

  if (!session) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">
            Please sign in to access portfolio optimization
          </h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Portfolio Optimization</h1>
          {optimizationResults && (
            <button
              onClick={handleRebalance}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Calculate Rebalancing Trades
            </button>
          )}
        </div>

        {/* Main Optimization Panel */}
        <div className="mb-8">
          <PortfolioOptimizationPanel />
        </div>

        {/* Rebalancing Trades */}
        {rebalancingTrades.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Required Trades</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Current Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {rebalancingTrades.map((trade) => {
                    const position = positions.find(p => p.symbol === trade.symbol);
                    const currentPrice = position?.price || 0;
                    const totalValue = trade.amount;

                    return (
                      <tr key={trade.symbol}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {trade.symbol}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            trade.type === 'buy'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {trade.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          ${trade.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          ${currentPrice.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          ${totalValue.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              * These trades will rebalance your portfolio to match the optimal allocation.
              Please review carefully before executing any trades.
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}