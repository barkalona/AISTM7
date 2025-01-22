import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useNotifications } from '@/providers/NotificationProvider';

interface PricePrediction {
  current_price: number;
  predicted_price: number;
  predicted_change_percent: number;
  prediction_confidence: number;
}

interface MarketSentiment {
  sentiment_score: number;
  rsi: number;
  macd: number;
  volume_trend: number;
}

interface AnomalyData {
  anomaly_dates: string[];
  anomaly_count: number;
  latest_anomaly: string | null;
}

interface ModelStatus {
  has_model: boolean;
  last_trained: string | null;
}

interface PortfolioAnalysis {
  predictions: { [symbol: string]: PricePrediction };
  sentiment: { [symbol: string]: MarketSentiment };
  anomalies: { [symbol: string]: AnomalyData };
  portfolio_risk: any;
}

export function useAIAnalysis() {
  const { data: session } = useSession();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<{ [symbol: string]: PricePrediction }>({});
  const [sentiment, setSentiment] = useState<{ [symbol: string]: MarketSentiment }>({});
  const [anomalies, setAnomalies] = useState<{ [symbol: string]: AnomalyData }>({});
  const [modelStatus, setModelStatus] = useState<{ [symbol: string]: ModelStatus }>({});

  const getPricePrediction = useCallback(async (symbol: string, days: number = 60) => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/ai/predict/${symbol}?days=${days}`);
      if (!response.ok) throw new Error('Failed to get price prediction');

      const data = await response.json();
      setPredictions(prev => ({
        ...prev,
        [symbol]: data.data
      }));
    } catch (error) {
      console.error('Error getting price prediction:', error);
      addNotification({
        type: 'error',
        title: 'Prediction Error',
        message: 'Failed to get price prediction',
        userId: 'system'
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, addNotification]);

  const trainModel = useCallback(async (symbol: string, days: number = 252) => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/ai/train/${symbol}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
      });

      if (!response.ok) throw new Error('Failed to train model');

      const data = await response.json();
      addNotification({
        type: 'success',
        title: 'Model Training',
        message: `Successfully trained model for ${symbol}`,
        userId: 'system'
      });

      return data.data;
    } catch (error) {
      console.error('Error training model:', error);
      addNotification({
        type: 'error',
        title: 'Training Error',
        message: 'Failed to train model',
        userId: 'system'
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, addNotification]);

  const getMarketSentiment = useCallback(async (symbol: string, days: number = 14) => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/ai/sentiment/${symbol}?days=${days}`);
      if (!response.ok) throw new Error('Failed to get market sentiment');

      const data = await response.json();
      setSentiment(prev => ({
        ...prev,
        [symbol]: data.data
      }));
    } catch (error) {
      console.error('Error getting market sentiment:', error);
      addNotification({
        type: 'error',
        title: 'Sentiment Analysis Error',
        message: 'Failed to get market sentiment',
        userId: 'system'
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, addNotification]);

  const detectAnomalies = useCallback(async (symbols: string[], days: number = 30) => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/anomalies/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols, days })
      });

      if (!response.ok) throw new Error('Failed to detect anomalies');

      const data = await response.json();
      setAnomalies(data.data);
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      addNotification({
        type: 'error',
        title: 'Anomaly Detection Error',
        message: 'Failed to detect anomalies',
        userId: 'system'
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, addNotification]);

  const getPortfolioAnalysis = useCallback(async (days: number = 30) => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/ai/portfolio/analysis?days=${days}`);
      if (!response.ok) throw new Error('Failed to get portfolio analysis');

      const data = await response.json();
      const analysis: PortfolioAnalysis = data.data;

      setPredictions(analysis.predictions);
      setSentiment(analysis.sentiment);
      setAnomalies(analysis.anomalies);

      return analysis;
    } catch (error) {
      console.error('Error getting portfolio analysis:', error);
      addNotification({
        type: 'error',
        title: 'Analysis Error',
        message: 'Failed to get portfolio analysis',
        userId: 'system'
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, addNotification]);

  const getModelStatus = useCallback(async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/models/status');
      if (!response.ok) throw new Error('Failed to get model status');

      const data = await response.json();
      setModelStatus(data.data);
    } catch (error) {
      console.error('Error getting model status:', error);
      addNotification({
        type: 'error',
        title: 'Status Error',
        message: 'Failed to get model status',
        userId: 'system'
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, addNotification]);

  // Format prediction for display
  const formatPrediction = useCallback((prediction: PricePrediction) => {
    return {
      currentPrice: `$${prediction.current_price.toLocaleString()}`,
      predictedPrice: `$${prediction.predicted_price.toLocaleString()}`,
      changePercent: `${prediction.predicted_change_percent > 0 ? '+' : ''}${prediction.predicted_change_percent.toFixed(2)}%`,
      confidence: `${(prediction.prediction_confidence * 100).toFixed(1)}%`
    };
  }, []);

  return {
    isLoading,
    predictions,
    sentiment,
    anomalies,
    modelStatus,
    getPricePrediction,
    trainModel,
    getMarketSentiment,
    detectAnomalies,
    getPortfolioAnalysis,
    getModelStatus,
    formatPrediction
  };
}