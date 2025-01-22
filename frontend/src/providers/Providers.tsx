'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from './ThemeProvider';
import { NotificationProvider } from './NotificationProvider';
import { WalletProvider } from './WalletProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <NotificationProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </NotificationProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}