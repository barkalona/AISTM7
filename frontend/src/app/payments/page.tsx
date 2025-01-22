'use client';

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import TokenPurchaseForm from '@/components/TokenPurchaseForm';
import PurchaseHistory from '@/components/PurchaseHistory';
import { useTokenAccess } from '@/hooks/useTokenAccess';
import { formatTokenAmount } from '@/services/tokenPurchase';

export default function PaymentsPage() {
  const { publicKey } = useWallet();
  const { data: session } = useSession();
  const router = useRouter();
  const { hasAccess, balance, requiredBalance, isLoading } = useTokenAccess();

  useEffect(() => {
    if (!session && !isLoading) {
      router.push('/auth/signin');
    }
  }, [session, isLoading, router]);

  if (!session || !publicKey) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">
            Please connect your wallet and sign in to access the payments page
          </h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Token Status Banner */}
        <div className={`mb-8 p-4 rounded-lg ${
          hasAccess ? 'bg-green-50 dark:bg-green-900' : 'bg-yellow-50 dark:bg-yellow-900'
        }`}>
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${
              hasAccess ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {hasAccess ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${
                hasAccess ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'
              }`}>
                {hasAccess
                  ? `Access Granted - Current Balance: ${formatTokenAmount(balance)}`
                  : `Minimum Required Balance: ${formatTokenAmount(requiredBalance)}`
                }
              </h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Purchase Form */}
          <div>
            <TokenPurchaseForm />
          </div>

          {/* Purchase History */}
          <div>
            <PurchaseHistory />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}