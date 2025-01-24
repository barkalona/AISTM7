import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface BalanceResult {
  hasRequiredBalance: boolean;
  currentBalance: number;
  requiredAmount: number;
  shortfall: number;
}

interface RequirementResult {
  requiredAmount: number;
  targetUsdValue: number;
  lastUpdate: string;
}

interface TokenPrice {
  price: number;
  lastUpdate: string;
}

export function useTokenAccess() {
  const { connected, publicKey } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [price, setPrice] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [requiredBalance, setRequiredBalance] = useState<number>(0);
  const [hasAccess, setHasAccess] = useState(false);

  const verifyBalance = useCallback(async (walletAddress: string): Promise<BalanceResult> => {
    try {
      const response = await fetch(`/api/token/balance/${walletAddress}`);
      if (!response.ok) {
        throw new Error('Failed to verify token balance');
      }
      const result = await response.json();
      setBalance(result.currentBalance);
      setRequiredBalance(result.requiredAmount);
      setHasAccess(result.hasRequiredBalance);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify token balance';
      setError(message);
      throw err;
    }
  }, []);

  const getCurrentRequirement = useCallback(async (): Promise<RequirementResult> => {
    try {
      const response = await fetch('/api/token/requirement');
      if (!response.ok) {
        throw new Error('Failed to get current requirement');
      }
      const result = await response.json();
      setRequiredBalance(result.requiredAmount);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get current requirement';
      setError(message);
      throw err;
    }
  }, []);

  const getTokenPrice = useCallback(async (): Promise<TokenPrice> => {
    try {
      const response = await fetch('/api/token/price');
      if (!response.ok) {
        throw new Error('Failed to get token price');
      }
      const result = await response.json();
      setPrice(result.price);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get token price';
      setError(message);
      throw err;
    }
  }, []);

  const formatUsdValue = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      if (!connected || !publicKey) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        await Promise.all([
          verifyBalance(publicKey.toString()),
          getCurrentRequirement(),
          getTokenPrice(),
        ]);
      } catch (err) {
        console.error('Error initializing token access data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();

    // Poll for updates every minute
    const interval = setInterval(initializeData, 60000);
    return () => clearInterval(interval);
  }, [connected, publicKey, verifyBalance, getCurrentRequirement, getTokenPrice]);

  return {
    verifyBalance,
    getCurrentRequirement,
    getTokenPrice,
    formatUsdValue,
    error,
    isLoading,
    price,
    balance,
    requiredBalance,
    hasAccess,
  };
}