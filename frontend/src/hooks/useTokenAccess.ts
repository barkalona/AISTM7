import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSession } from 'next-auth/react';
import { useNotifications } from '@/providers/NotificationProvider';
import { getTokenBalance, watchTokenBalance, TokenBalance } from '@/services/solana';

interface TokenAccess {
  hasAccess: boolean;
  isLoading: boolean;
  error: string | null;
  balance: number;
  requiredBalance: number;
  price: number;
}

interface TokenPrice {
  price: number;
  minimumTokens: number;
  timestamp: number;
}

export function useTokenAccess() {
  const { publicKey } = useWallet();
  const { data: session } = useSession();
  const { addNotification } = useNotifications();
  const [tokenAccess, setTokenAccess] = useState<TokenAccess>({
    hasAccess: false,
    isLoading: true,
    error: null,
    balance: 0,
    requiredBalance: 700000, // Default value
    price: 0
  });

  const checkAccess = useCallback(async () => {
    if (!publicKey || !session) {
      setTokenAccess(prev => ({
        ...prev,
        hasAccess: false,
        isLoading: false,
        error: 'Wallet not connected'
      }));
      return;
    }

    try {
      // Fetch token price and balance in parallel
      const [priceResponse, balance] = await Promise.all([
        fetch('/api/token/price'),
        getTokenBalance(publicKey.toString())
      ]);

      if (!priceResponse.ok) {
        throw new Error('Failed to fetch token price');
      }

      const priceData: TokenPrice = await priceResponse.json();

      setTokenAccess({
        hasAccess: balance.amount >= priceData.minimumTokens,
        isLoading: false,
        error: null,
        balance: balance.amount,
        requiredBalance: priceData.minimumTokens,
        price: priceData.price
      });

      // Show notification if balance is insufficient
      if (!balance.meetsMinimum) {
        addNotification({
          type: 'warning',
          title: 'Insufficient Token Balance',
          message: `You need ${priceData.minimumTokens.toLocaleString()} AISTM7 tokens to access the platform.`,
          userId: 'system'
        });
      }
    } catch (error) {
      console.error('Error checking token access:', error);
      setTokenAccess(prev => ({
        ...prev,
        hasAccess: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check token access'
      }));
    }
  }, [publicKey, session, addNotification]);

  // Initial check
  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Set up balance monitoring
  useEffect(() => {
    if (!publicKey) return;

    let cleanupFn: (() => void) | undefined;

    const setupWatcher = async () => {
      try {
        const handleBalanceChange = async (balance: TokenBalance) => {
          try {
            const priceResponse = await fetch('/api/token/price');
            if (!priceResponse.ok) {
              throw new Error('Failed to fetch token price');
            }

            const priceData: TokenPrice = await priceResponse.json();

            setTokenAccess(prev => ({
              ...prev,
              hasAccess: balance.amount >= priceData.minimumTokens,
              balance: balance.amount,
              requiredBalance: priceData.minimumTokens,
              price: priceData.price
            }));

            // Notify if access status changes
            if (balance.amount < priceData.minimumTokens) {
              addNotification({
                type: 'warning',
                title: 'Access Lost',
                message: 'Your token balance has fallen below the required minimum.',
                userId: 'system'
              });
            }
          } catch (error) {
            console.error('Error updating token access:', error);
          }
        };

        cleanupFn = await watchTokenBalance(publicKey.toString(), handleBalanceChange);
      } catch (error) {
        console.error('Error setting up balance watcher:', error);
      }
    };

    setupWatcher();

    return () => {
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [publicKey, addNotification]);

  const formatUsdValue = useCallback((tokens: number) => {
    const usdValue = tokens * tokenAccess.price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(usdValue);
  }, [tokenAccess.price]);

  return {
    ...tokenAccess,
    checkAccess,
    formatUsdValue,
    currentValue: formatUsdValue(tokenAccess.balance),
    requiredValue: formatUsdValue(tokenAccess.requiredBalance)
  };
}