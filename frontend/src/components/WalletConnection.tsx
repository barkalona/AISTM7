"use client";

import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';

export default function WalletConnection() {
  const { connected, connect, disconnect, publicKey } = useWallet();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="flex items-center space-x-4">
      {connected ? (
        <div className="flex items-center space-x-3">
          {/* Security Status */}
          <div className="hidden md:flex items-center space-x-2 glass-card px-3 py-1.5 rounded-lg bg-white/5">
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-mono text-blue-200/80">SECURE</span>
            </div>
          </div>

          {/* Wallet Address */}
          <div className="glass-card px-3 py-1.5 rounded-lg bg-white/5">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm text-blue-200/80">
                {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
              </span>
            </div>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={() => disconnect()}
            className="relative group"
          >
            <div className="absolute inset-0 bg-red-500/20 rounded-lg blur-lg opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative px-4 py-1.5 bg-red-500/20 backdrop-blur-sm rounded-lg border border-red-500/20 text-red-300 hover:text-red-200 transition-colors">
              <span className="text-sm font-semibold">Disconnect</span>
            </div>
          </button>
        </div>
      ) : (
        <button
          onClick={() => connect()}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg blur-lg opacity-75 group-hover:opacity-100 transition-opacity" />
          <div className="relative px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg">
            <span className="text-white font-semibold">Connect Wallet</span>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-px bg-white/50 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform" />
          </div>
        </button>
      )}
    </div>
  );
}