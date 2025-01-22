"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNotifications } from '../../providers/NotificationProvider';
import ProtectedRoute from '../../components/ProtectedRoute';
import RiskChart from '../../components/RiskChart';
import RecommendationPanel from '../../components/RecommendationPanel';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { connected } = useWallet();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (connected && session) {
      addNotification({
        type: 'info',
        title: 'Portfolio Data',
        message: 'Loading your portfolio data...',
        userId: 'system'
      });
    }
  }, [connected, session, addNotification]);

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Risk Analysis Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Last updated: {new Date().toLocaleString()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Risk Analysis Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Risk Analysis</h2>
            <div className="h-80">
              <RiskChart />
            </div>
          </div>

          {/* Portfolio Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Portfolio Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Value at Risk (VaR)</p>
                <p className="text-2xl font-bold">$12,345</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Sharpe Ratio</p>
                <p className="text-2xl font-bold">1.23</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Beta</p>
                <p className="text-2xl font-bold">0.85</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Alpha</p>
                <p className="text-2xl font-bold">2.1%</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">AI Recommendations</h2>
          <RecommendationPanel />
        </div>
      </div>
    </ProtectedRoute>
  );
}