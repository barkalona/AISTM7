"use client";

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import DashboardLayout, { DashboardGrid, DashboardCard } from '../../components/DashboardLayout';
import { LoadingButton } from '../../components/Loading';
import { formatCurrency, formatPercentage, formatLargeNumber } from '../../utils/format';
import { useNotifications } from '../../providers/NotificationProvider';

interface Position {
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  value: number;
  costBasis: number;
  unrealizedPnL: number;
  allocation: number;
  dayChange: number;
  weekChange: number;
}

interface PortfolioMetrics {
  totalValue: number;
  totalPnL: number;
  dayChange: number;
  weekChange: number;
  monthChange: number;
  yearChange: number;
  cashBalance: number;
  marginUsed: number;
  buyingPower: number;
}

interface OptimizationSuggestion {
  type: string;
  description: string;
  impact: {
    risk: number;
    return: number;
  };
  actions: Array<{
    symbol: string;
    action: 'buy' | 'sell';
    quantity: number;
    reason: string;
  }>;
}

const PortfolioPage = () => {
  const { connected, publicKey } = useWallet();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState<Position[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Position;
    direction: 'asc' | 'desc';
  }>({ key: 'value', direction: 'desc' });

  useEffect(() => {
    if (connected && publicKey) {
      fetchPortfolioData();
    }
  }, [connected, publicKey]);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      
      // Simulated data - replace with actual API calls
      const mockPositions: Position[] = [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          quantity: 2.5,
          price: 45000,
          value: 112500,
          costBasis: 95000,
          unrealizedPnL: 17500,
          allocation: 0.35,
          dayChange: 0.025,
          weekChange: 0.045
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          quantity: 15,
          price: 3000,
          value: 45000,
          costBasis: 40000,
          unrealizedPnL: 5000,
          allocation: 0.25,
          dayChange: -0.015,
          weekChange: 0.03
        },
        {
          symbol: 'SOL',
          name: 'Solana',
          quantity: 500,
          price: 100,
          value: 50000,
          costBasis: 45000,
          unrealizedPnL: 5000,
          allocation: 0.20,
          dayChange: 0.035,
          weekChange: 0.06
        }
      ];

      const mockMetrics: PortfolioMetrics = {
        totalValue: 207500,
        totalPnL: 27500,
        dayChange: 0.023,
        weekChange: 0.045,
        monthChange: 0.12,
        yearChange: 0.45,
        cashBalance: 25000,
        marginUsed: 50000,
        buyingPower: 75000
      };

      const mockSuggestions: OptimizationSuggestion[] = [
        {
          type: 'Risk Reduction',
          description: 'Reduce portfolio concentration in cryptocurrencies',
          impact: {
            risk: -0.15,
            return: -0.05
          },
          actions: [
            {
              symbol: 'BTC',
              action: 'sell',
              quantity: 0.5,
              reason: 'High correlation with other crypto assets'
            },
            {
              symbol: 'ETH',
              action: 'sell',
              quantity: 3,
              reason: 'Portfolio overweight in crypto sector'
            }
          ]
        },
        {
          type: 'Return Optimization',
          description: 'Increase exposure to high-momentum assets',
          impact: {
            risk: 0.05,
            return: 0.12
          },
          actions: [
            {
              symbol: 'SOL',
              action: 'buy',
              quantity: 100,
              reason: 'Strong technical indicators and momentum'
            }
          ]
        }
      ];

      setPositions(mockPositions);
      setMetrics(mockMetrics);
      setSuggestions(mockSuggestions);
      
      addNotification({
        type: 'success',
        title: 'Portfolio Updated',
        message: 'Latest portfolio data loaded successfully',
        userId: 'system'
      });
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      addNotification({
        type: 'error',
        title: 'Portfolio Error',
        message: 'Failed to load portfolio data. Please try again.',
        userId: 'system'
      });
    } finally {
      setLoading(false);
    }
  };

  const sortPositions = (a: Position, b: Position) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  };

  const handleSort = (key: keyof Position) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <DashboardLayout
      title="Portfolio"
      subtitle="Portfolio holdings and optimization suggestions"
      loading={loading}
      actions={
        <LoadingButton
          loading={loading}
          onClick={fetchPortfolioData}
          variant="outline"
          size="sm"
        >
          Refresh Portfolio
        </LoadingButton>
      }
    >
      <DashboardGrid columns={3}>
        {/* Portfolio Summary */}
        <DashboardCard
          title="Portfolio Summary"
          className="col-span-2"
        >
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics ? formatCurrency(metrics.totalValue) : '-'}
              </p>
              <p className={`text-sm ${
                metrics?.dayChange && metrics.dayChange > 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {metrics ? formatPercentage(metrics.dayChange) : '-'} today
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total P&L</p>
              <p className={`text-2xl font-bold ${
                metrics?.totalPnL && metrics.totalPnL > 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {metrics ? formatCurrency(metrics.totalPnL) : '-'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {metrics ? formatPercentage(metrics.yearChange) : '-'} YTD
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Cash Balance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics ? formatCurrency(metrics.cashBalance) : '-'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Available</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Buying Power</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics ? formatCurrency(metrics.buyingPower) : '-'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {metrics ? formatPercentage(metrics.marginUsed / metrics.totalValue) : '-'} margin used
              </p>
            </div>
          </div>

          {/* Positions Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('symbol')}
                  >
                    Asset
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('quantity')}
                  >
                    Quantity
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('price')}
                  >
                    Price
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('value')}
                  >
                    Value
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('unrealizedPnL')}
                  >
                    P&L
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('dayChange')}
                  >
                    24h
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {positions.sort(sortPositions).map((position) => (
                  <tr key={position.symbol}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {position.symbol}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {position.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                      {position.quantity.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                      {formatCurrency(position.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                      {formatCurrency(position.value)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm ${
                      position.unrealizedPnL > 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(position.unrealizedPnL)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm ${
                      position.dayChange > 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatPercentage(position.dayChange)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>

        {/* Optimization Suggestions */}
        <DashboardCard
          title="Portfolio Optimization"
          className="row-span-2"
        >
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {suggestion.type}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {suggestion.description}
                </p>
                <div className="flex justify-between mb-4">
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Risk Impact: </span>
                    <span className={suggestion.impact.risk < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {formatPercentage(suggestion.impact.risk)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Return Impact: </span>
                    <span className={suggestion.impact.return > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {formatPercentage(suggestion.impact.return)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {suggestion.actions.map((action, actionIndex) => (
                    <div
                      key={actionIndex}
                      className="flex justify-between items-center text-sm"
                    >
                      <div>
                        <span className={`font-medium ${
                          action.action === 'buy'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {action.action.toUpperCase()}
                        </span>
                        <span className="text-gray-900 dark:text-white">
                          {' '}{action.quantity} {action.symbol}
                        </span>
                      </div>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        {action.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </DashboardGrid>
    </DashboardLayout>
  );
};

export default PortfolioPage;
