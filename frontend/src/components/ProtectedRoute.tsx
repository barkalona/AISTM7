"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNotifications } from '../providers/NotificationProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireWallet?: boolean;
}

export default function ProtectedRoute({ children, requireWallet = true }: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const { connected } = useWallet();
  const router = useRouter();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      addNotification({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please sign in to access this page',
        userId: 'system'
      });
      router.push('/auth/signin');
      return;
    }

    if (requireWallet && !connected) {
      addNotification({
        type: 'warning',
        title: 'Wallet Required',
        message: 'Please connect your wallet to access this page',
        userId: 'system'
      });
      router.push('/');
      return;
    }
  }, [session, status, connected, requireWallet, router, addNotification]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session || (requireWallet && !connected)) {
    return null;
  }

  return <>{children}</>;
}