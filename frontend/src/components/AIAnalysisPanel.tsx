'use client';

import { useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { usePortfolioWebSocket } from '@/hooks/usePortfolioWebSocket';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function AIAnalysisPanel() {
  const {
    isLoading,
    predictions,
    sentiment,
    anomalies,
    modelStatus,
    getPricePrediction,
    trainModel,
    getMarketSentiment,
    detectAnomalies,
    formatPrediction
  } = useAIAnalysis();

  const { positions } = usePortfolioWebSocket();

  useEffect(() => {
    if (positions.length > 0) {
      const symbols = positions.map(p => p.symbol);
      detectAnomalies(symbols);
      symbols.forEach(symbol => {
        getPricePrediction(symbol);
        getMarketSentiment(symbol);
      });
    }
  }, [positions, detectAnomalies, getPricePrediction, getMarketSentiment]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Sentiment Overview */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Market Sentiment Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {positions.map((position) => {
            const sentimentData = sentiment[position.symbol];
            if (!sentimentData) return null;

            return (
              <div
                key={position.symbol}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h3 className="font-medium mb-2">{position.symbol}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Sentiment Score</span>
                    <span className={`font-medium ${
                      sentimentData.sentiment_score > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {sentimentData.sentiment_score.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">RSI</span>
                    <span className="font-medium">{sentimentData.rsi.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">MACD</span>
                    <span className={`font-medium ${
                      sentimentData.macd > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {sentimentData.macd.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Predictions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Price Predictions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {positions.map((position) => {
            const prediction = predictions[position.symbol];
            if (!prediction) return null;

            const formatted = formatPrediction(prediction);
            return (
              <div
                key={position.symbol}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h3 className="font-medium mb-2">{position.symbol}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Current Price</span>
                    <span className="font-medium">{formatted.currentPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Predicted Price</span>
                    <span className="font-medium">{formatted.predictedPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Expected Change</span>
                    <span className={`font-medium ${
                      prediction.predicted_change_percent > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatted.changePercent}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Confidence</span>
                    <span className="font-medium">{formatted.confidence}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Anomaly Detection */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Anomaly Detection</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {positions.map((position) => {
            const anomalyData = anomalies[position.symbol];
            if (!anomalyData) return null;

            return (
              <div
                key={position.symbol}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <h3 className="font-medium mb-2">{position.symbol}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Anomalies Found</span>
                    <span className="font-medium">{anomalyData.anomaly_count}</span>
                  </div>
                  {anomalyData.latest_anomaly && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Latest Anomaly</span>
                      <span className="font-medium">
                        {new Date(anomalyData.latest_anomaly).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {anomalyData.anomaly_count > 0 && (
                    <div className="mt-2">
                      <div className="text-sm text-yellow-600 dark:text-yellow-400">
                        ⚠️ Unusual market behavior detected
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model Training Controls */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Model Management</h2>
          <button
            onClick={() => positions.forEach(p => trainModel(p.symbol))}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Train All Models
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {positions.map((position) => {
            const status = modelStatus[position.symbol];
            if (!status) return null;

            return (
              <div
                key={position.symbol}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{position.symbol}</h3>
                  <button
                    onClick={() => trainModel(position.symbol)}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Train Model
                  </button>
                </div>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    status.has_model
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {status.has_model ? 'Model Ready' : 'No Model'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}