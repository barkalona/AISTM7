'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNotifications } from '@/providers/NotificationProvider';

const MIN_TOKEN_BALANCE = 700_000;

export default function WalletBalance() {
  const { data: session } = useSession();
  const { connected, publicKey } = useWallet();
  const { addNotification } = useNotifications();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) return;
      
      try {
        const response = await fetch('/api/wallet/balance', {
          headers: {
            'wallet-address': publicKey.toString()
          }
        });
        if (!response.ok) throw new Error('Failed to fetch balance');
        const data = await response.json();
        setBalance(data.balance);
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Wallet Error',
          message: 'Failed to fetch wallet balance',
          userId: 'system'
        });
        setBalance(null);
      } finally {
        setLoading(false);
      }
    };

    if (session && connected && publicKey) {
      fetchBalance();
    } else {
      setLoading(false);
    }
  }, [session, connected, publicKey, addNotification]);

  if (!session || !connected || loading) {
    return null;
  }

  const hasMinBalance = balance !== null && balance >= MIN_TOKEN_BALANCE;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            AISTM7 Token Balance
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Minimum required: {MIN_TOKEN_BALANCE.toLocaleString()} tokens
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {balance?.toLocaleString() ?? '---'} tokens
          </p>
          <p
            className={`text-sm ${
              hasMinBalance
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {hasMinBalance ? 'Sufficient balance' : 'Insufficient balance'}
          </p>
        </div>
      </div>
      {!hasMinBalance && (
        <div className="mt-4">
          <a
            href="/payments"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Get AISTM7 Tokens
          </a>
        </div>
      )}
    </div>
  );
}