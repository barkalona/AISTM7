'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTokenAccess } from '@/hooks/useTokenAccess';
import { useNotifications } from '@/providers/NotificationProvider';

interface TokenGateProps {
  children: React.ReactNode;
  fallbackUrl?: string;
}

export function TokenGate({ children, fallbackUrl = '/payments' }: TokenGateProps) {
  const router = useRouter();
  const { hasAccess, isLoading, currentValue, requiredValue } = useTokenAccess();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      addNotification({
        type: 'warning',
        title: 'Access Restricted',
        message: `You need a minimum balance of ${requiredValue} worth of AISTM7 tokens. Current value: ${currentValue}`,
        userId: 'system'
      });
      router.push(fallbackUrl);
    }
  }, [hasAccess, isLoading, router, fallbackUrl, addNotification, currentValue, requiredValue]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}

export function withTokenGate<P extends object>(
  Component: React.ComponentType<P>,
  fallbackUrl?: string
) {
  return function TokenGatedComponent(props: P) {
    return (
      <TokenGate fallbackUrl={fallbackUrl}>
        <Component {...props} />
      </TokenGate>
    );
  };
}

// Example usage:
// const ProtectedPage = withTokenGate(YourComponent);
// export default ProtectedPage;