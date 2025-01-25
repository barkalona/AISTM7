'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/services/api';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_WS_URL: string;
    }
  }
}

export interface PredictionMetrics {
  current_price: number;
  predicted_price: number;
  predicted_change_percent: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  uncertainty: number;
  prediction_std: number;
}

export interface MarketSentiment {
  sentiment_score: number;
  rsi: number;
  macd: number;
  volume_trend: number;
}

export interface ModelInfo {
  symbol: string;
  features: string[];
  sequence_length: number;
  training_date: string;
  training_samples: number;
  final_train_loss: number;
  final_val_loss: number;
  best_val_loss: number;
  training_epochs: number;
}

interface UseAIAnalysisReturn {
  predictions: Record<string, PredictionMetrics>;
  sentiment: Record<string, MarketSentiment>;
  modelInfo: Record<string, ModelInfo>;
  loading: boolean;
  error: Error | null;
  getPrediction: (symbol: string) => Promise<void>;
  getSentiment: (symbol: string) => Promise<void>;
  getModelInfo: (symbol: string) => Promise<void>;
  trainModel: (symbol: string, historicalData: any) => Promise<void>;
}

export function useAIAnalysis(): UseAIAnalysisReturn {
  const { data: session } = useSession();
  const [predictions, setPredictions] = useState<Record<string, PredictionMetrics>>({});
  const [sentiment, setSentiment] = useState<Record<string, MarketSentiment>>({});
  const [modelInfo, setModelInfo] = useState<Record<string, ModelInfo>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get prediction for a symbol
  const getPrediction = useCallback(async (symbol: string) => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const response = await api.get(`/ai/prediction/${symbol}`);
      setPredictions((prev: Record<string, PredictionMetrics>) => ({
        ...prev,
        [symbol]: response.data
      }));
      setError(null);
    } catch (err) {
      console.error('Error getting prediction:', err);
      setError(err instanceof Error ? err : new Error('Failed to get prediction'));
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Get market sentiment analysis
  const getSentiment = useCallback(async (symbol: string) => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const response = await api.get(`/ai/sentiment/${symbol}`);
      setSentiment((prev: Record<string, MarketSentiment>) => ({
        ...prev,
        [symbol]: response.data
      }));
      setError(null);
    } catch (err) {
      console.error('Error getting sentiment:', err);
      setError(err instanceof Error ? err : new Error('Failed to get sentiment'));
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Get model information
  const getModelInfo = useCallback(async (symbol: string) => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const response = await api.get(`/ai/model-info/${symbol}`);
      setModelInfo((prev: Record<string, ModelInfo>) => ({
        ...prev,
        [symbol]: response.data
      }));
      setError(null);
    } catch (err) {
      console.error('Error getting model info:', err);
      setError(err instanceof Error ? err : new Error('Failed to get model info'));
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Train model for a symbol
  const trainModel = useCallback(async (symbol: string, historicalData: any) => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const response = await api.post(`/ai/train/${symbol}`, {
        historicalData
      });
      setModelInfo((prev: Record<string, ModelInfo>) => ({
        ...prev,
        [symbol]: response.data
      }));
      setError(null);
    } catch (err) {
      console.error('Error training model:', err);
      setError(err instanceof Error ? err : new Error('Failed to train model'));
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!session?.user?.id) return;

    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ai`);

    ws.onopen = () => {
      console.log('Connected to AI updates');
    };

    ws.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);
        
        switch (update.type) {
          case 'prediction':
            setPredictions((prev: Record<string, PredictionMetrics>) => ({
              ...prev,
              [update.symbol]: update.data
            }));
            break;
            
          case 'sentiment':
            setSentiment((prev: Record<string, MarketSentiment>) => ({
              ...prev,
              [update.symbol]: update.data
            }));
            break;
            
          case 'model_info':
            setModelInfo((prev: Record<string, ModelInfo>) => ({
              ...prev,
              [update.symbol]: update.data
            }));
            break;
        }
      } catch (err) {
        console.error('Error processing AI update:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('AI WebSocket error:', error);
      setError(new Error('WebSocket connection error'));
    };

    return () => {
      ws.close();
    };
  }, [session?.user?.id]);

  return {
    predictions,
    sentiment,
    modelInfo,
    loading,
    error,
    getPrediction,
    getSentiment,
    getModelInfo,
    trainModel
  };
}