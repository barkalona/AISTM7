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

export interface TokenAnalytics {
  totalSupply: string;
  circulatingSupply: string;
  holders: number;
  largestHolders: Array<{
    address: string;
    balance: string;
  }>;
}

export interface Transaction {
  signature: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed' | 'error';
  amount: string;
  from: string;
  to: string;
  error?: string;
}

export interface TransactionUpdate {
  signature: string;
  status: Transaction['status'];
  error?: string;
  timestamp: number;
  logs?: string[];
}

interface UseSolanaDataReturn {
  analytics: TokenAnalytics | null;
  transactions: Transaction[];
  pendingTransactions: Transaction[];
  loading: boolean;
  error: Error | null;
  refreshAnalytics: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  transferTokens: (toAddress: string, amount: number) => Promise<string>;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

export function useSolanaData(): UseSolanaDataReturn {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<TokenAnalytics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch token analytics
  const refreshAnalytics = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await api.get('/blockchain/analytics');
      setAnalytics(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching token analytics:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch analytics'));
    }
  }, [session?.user?.id]);

  // Fetch transaction history
  const refreshTransactions = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await api.get('/blockchain/transactions');
      setTransactions(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
    }
  }, [session?.user?.id]);

  // Transfer tokens
  const transferTokens = useCallback(async (toAddress: string, amount: number) => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await api.post('/blockchain/transfer', {
        toAddress,
        amount
      });

      // Add to pending transactions
      const newTx: Transaction = {
        signature: response.data.signature,
        timestamp: Date.now(),
        status: 'pending',
        amount: amount.toString(),
        from: session.user.id,
        to: toAddress
      };

      setPendingTransactions((prev: Transaction[]) => [newTx, ...prev]);
      return response.data.signature;
    } catch (err) {
      console.error('Error transferring tokens:', err);
      throw err instanceof Error ? err : new Error('Failed to transfer tokens');
    }
  }, [session?.user?.id]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!session?.user?.id) return;

    const ws = new WebSocket(`${WS_URL}/blockchain`);

    ws.onopen = () => {
      console.log('Connected to blockchain updates');
    };

    ws.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data) as TransactionUpdate;

        if (update.status === 'pending') {
          // Update pending transaction status
          setPendingTransactions((prev: Transaction[]) => 
            prev.map((tx: Transaction) => 
              tx.signature === update.signature
                ? { ...tx, ...update }
                : tx
            )
          );
        } else {
          // Move from pending to completed
          setPendingTransactions((prev: Transaction[]) => 
            prev.filter((tx: Transaction) => tx.signature !== update.signature)
          );

          setTransactions((prev: Transaction[]) => [{
            signature: update.signature,
            status: update.status,
            timestamp: update.timestamp,
            error: update.error,
            // Preserve original transaction data
            ...prev.find((tx: Transaction) => tx.signature === update.signature),
          } as Transaction, ...prev]);
        }
      } catch (err) {
        console.error('Error processing blockchain update:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('Blockchain WebSocket error:', error);
      setError(new Error('WebSocket connection error'));
    };

    // Initial data fetch
    setLoading(true);
    Promise.all([
      refreshAnalytics(),
      refreshTransactions()
    ]).finally(() => {
      setLoading(false);
    });

    return () => {
      ws.close();
    };
  }, [session?.user?.id, refreshAnalytics, refreshTransactions]);

  return {
    analytics,
    transactions,
    pendingTransactions,
    loading,
    error,
    refreshAnalytics,
    refreshTransactions,
    transferTokens
  };
}