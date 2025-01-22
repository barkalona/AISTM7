"use client";

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNotifications } from '../providers/NotificationProvider';
import WalletBalance from '../components/WalletBalance';

export default function Home() {
  const { connected } = useWallet();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!connected) {
      addNotification({
        type: 'info',
        title: 'Wallet Connection',
        message: 'Please connect your wallet to access AISTM7 features',
        userId: 'system'
      });
    }
  }, [connected, addNotification]);

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">AISTM7 Risk Analysis Dashboard</h1>
          <WalletBalance />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Portfolio Overview Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Portfolio Overview</h2>
            <p className="text-gray-600 dark:text-gray-300">
              {connected 
                ? "View your portfolio analysis and risk metrics."
                : "Connect your wallet to view your portfolio analysis and risk metrics."}
            </p>
          </div>

          {/* Risk Metrics Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Risk Metrics</h2>
            <p className="text-gray-600 dark:text-gray-300">
              {connected 
                ? "View detailed risk analysis including VaR, Sharpe ratio, and stress tests."
                : "Connect your wallet to view detailed risk analysis."}
            </p>
          </div>

          {/* AI Recommendations Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">AI Recommendations</h2>
            <p className="text-gray-600 dark:text-gray-300">
              {connected 
                ? "Get AI-powered insights and portfolio optimization suggestions."
                : "Connect your wallet to receive AI-powered insights."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
