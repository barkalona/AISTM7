"use client";

import { ThemeProvider } from 'next-themes';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useMemo } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  // Initialize wallet adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ThemeProvider>
  );
}