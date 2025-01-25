'use client';

import type { 
  MarketData, 
  MarketDataUpdate, 
  BatchUpdate, 
  ConnectionState, 
  WebSocketMessage,
  UseMarketDataReturn 
} from '@/types/market';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/services/api';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_WS_URL: string;
    }
  }
}

const RECONNECT_DELAY = 1000;
const MAX_RECONNECT_ATTEMPTS = 5;
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

export function useMarketData(): UseMarketDataReturn {
  const { data: session } = useSession();
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>();
  const subscribedContracts = useRef<Set<string>>(new Set());

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    if (!session?.user?.id || wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionState('connecting');
    
    const ws = new WebSocket(`${WS_URL}/portfolio/live`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionState('connected');
      setError(null);
      reconnectAttempts.current = 0;

      // Resubscribe to existing contracts
      if (subscribedContracts.current.size > 0) {
        const contractIds = Array.from(subscribedContracts.current);
        api.post('/portfolio/subscribe', { contractIds }).catch(console.error);
      }
    };

    ws.onclose = () => {
      setConnectionState('disconnected');
      wsRef.current = null;

      // Attempt reconnection with exponential backoff
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectTimeout.current = setTimeout(() => {
          reconnectAttempts.current++;
          setConnectionState('reconnecting');
          initializeWebSocket();
        }, delay);
      } else {
        setError(new Error('Failed to maintain connection after multiple attempts'));
      }
    };

    ws.onerror = (event: Event) => {
      console.error('WebSocket error:', event);
      setError(new Error('WebSocket connection error'));
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        
        if (message.type === 'marketData') {
          if ('updates' in message) {
            // Handle batch update
            const batchUpdate = message as BatchUpdate;
            setMarketData((prevData: Record<string, MarketData>) => {
              const newData = { ...prevData };
              batchUpdate.updates.forEach(update => {
                newData[update.contractId] = {
                  ...update.data,
                  timestamp: Date.now()
                };
              });
              return newData;
            });
          } else {
            // Handle single update
            const update = message as MarketDataUpdate;
            setMarketData((prevData: Record<string, MarketData>) => ({
              ...prevData,
              [update.contractId]: {
                ...update.data,
                timestamp: Date.now()
              }
            }));
          }
        }
      } catch (error) {
        console.error('Error processing market data:', error);
      }
    };
  }, [session?.user?.id]);

  // Initialize connection when component mounts
  useEffect(() => {
    initializeWebSocket();
    
    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [initializeWebSocket]);

  // Subscribe to market data
  const subscribe = useCallback(async (contractIds: string[]) => {
    if (!session?.user?.id) return;

    try {
      await api.post('/portfolio/subscribe', { contractIds });
      contractIds.forEach(id => subscribedContracts.current.add(id));
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'subscribe',
          contractIds
        }));
      }
    } catch (error) {
      console.error('Error subscribing to market data:', error);
      setError(error instanceof Error ? error : new Error('Failed to subscribe'));
    }
  }, [session?.user?.id]);

  // Unsubscribe from market data
  const unsubscribe = useCallback(async (contractIds: string[]) => {
    if (!session?.user?.id) return;

    try {
      await api.post('/portfolio/unsubscribe', { contractIds });
      contractIds.forEach(id => {
        subscribedContracts.current.delete(id);
        setMarketData((prevData: Record<string, MarketData>) => {
          const newData = { ...prevData };
          delete newData[id];
          return newData;
        });
      });

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'unsubscribe',
          contractIds
        }));
      }
    } catch (error) {
      console.error('Error unsubscribing from market data:', error);
      setError(error instanceof Error ? error : new Error('Failed to unsubscribe'));
    }
  }, [session?.user?.id]);

  return {
    data: marketData,
    subscribe,
    unsubscribe,
    connectionState,
    error
  };
}