import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSession } from 'next-auth/react';
import { useNotifications } from '@/providers/NotificationProvider';
import { getTokenPurchaseQuote, createPurchaseTransaction, confirmTransaction } from '@/services/tokenPurchase';

interface PurchaseHistory {
  id: string;
  tokenAmount: number;
  solAmount: number;
  usdAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  transactionSignature: string | null;
  createdAt: string;
}

interface PurchaseStatistics {
  totalTokens: number;
  totalSpentSol: number;
  totalSpentUsd: number;
  totalTransactions: number;
}

interface PurchaseHistoryResponse {
  purchases: PurchaseHistory[];
  statistics: PurchaseStatistics;
}

export function useTokenPurchase() {
  const { publicKey, signTransaction } = useWallet();
  const { data: session } = useSession();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<PurchaseHistory[]>([]);
  const [statistics, setStatistics] = useState<PurchaseStatistics | null>(null);

  const fetchPurchaseHistory = useCallback(async () => {
    if (!publicKey || !session) return;

    try {
      const response = await fetch(`/api/purchases/${publicKey.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch purchase history');

      const data: PurchaseHistoryResponse = await response.json();
      setHistory(data.purchases);
      setStatistics(data.statistics);
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load purchase history',
        userId: 'system'
      });
    }
  }, [publicKey, session, addNotification]);

  const purchaseTokens = useCallback(async (usdAmount: number) => {
    if (!publicKey || !signTransaction || !session) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Please connect your wallet and sign in',
        userId: 'system'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Check purchase allowance
      const allowanceResponse = await fetch('/api/token/allowance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          amount: usdAmount
        })
      });

      if (!allowanceResponse.ok) {
        const error = await allowanceResponse.json();
        throw new Error(error.reason || 'Purchase not allowed');
      }

      // Get purchase quote
      const quote = await getTokenPurchaseQuote(usdAmount);

      // Create and sign transaction
      const transaction = await createPurchaseTransaction(
        publicKey.toString(),
        quote
      );
      const signedTransaction = await signTransaction(transaction);
      const signature = await signedTransaction.serialize();

      // Create purchase record
      const purchaseResponse = await fetch(`/api/purchases/${publicKey.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAmount: quote.tokenAmount,
          solAmount: quote.solAmount,
          usdAmount: quote.usdAmount,
          transactionSignature: signature.toString('base64')
        })
      });

      if (!purchaseResponse.ok) {
        throw new Error('Failed to create purchase record');
      }

      // Send transaction
      const confirmed = await confirmTransaction(signature.toString('base64'));
      if (!confirmed) {
        throw new Error('Transaction failed to confirm');
      }

      addNotification({
        type: 'success',
        title: 'Purchase Successful',
        message: `Successfully purchased ${quote.tokenAmount.toLocaleString()} AISTM7 tokens`,
        userId: 'system'
      });

      // Refresh purchase history
      await fetchPurchaseHistory();
    } catch (error) {
      console.error('Purchase error:', error);
      addNotification({
        type: 'error',
        title: 'Purchase Failed',
        message: error instanceof Error ? error.message : 'Failed to complete purchase',
        userId: 'system'
      });
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signTransaction, session, addNotification, fetchPurchaseHistory]);

  return {
    purchaseTokens,
    fetchPurchaseHistory,
    history,
    statistics,
    isLoading
  };
}