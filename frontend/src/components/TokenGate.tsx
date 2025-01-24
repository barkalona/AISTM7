import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTokenAccess } from '@/hooks/useTokenAccess';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface TokenGateProps {
  children: React.ReactNode;
}

interface RequirementInfo {
  requiredAmount: number;
  currentBalance: number;
  shortfall: number;
  targetUsdValue: number;
  lastUpdate: Date;
}

export const TokenGate: React.FC<TokenGateProps> = ({ children }) => {
  const { connected, publicKey } = useWallet();
  const [requirementInfo, setRequirementInfo] = useState<RequirementInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { verifyBalance, getCurrentRequirement } = useTokenAccess();

  useEffect(() => {
    const checkAccess = async () => {
      if (!connected || !publicKey) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [balanceResult, requirementResult] = await Promise.all([
          verifyBalance(publicKey.toString()),
          getCurrentRequirement()
        ]);

        setRequirementInfo({
          requiredAmount: balanceResult.requiredAmount,
          currentBalance: balanceResult.currentBalance,
          shortfall: balanceResult.shortfall,
          targetUsdValue: requirementResult.targetUsdValue,
          lastUpdate: new Date(requirementResult.lastUpdate)
        });
      } catch (error) {
        console.error('Error checking token access:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
    // Poll for updates every minute
    const interval = setInterval(checkAccess, 60000);
    return () => clearInterval(interval);
  }, [connected, publicKey, verifyBalance, getCurrentRequirement]);

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
        <h2 className="text-2xl font-bold">Connect Your Wallet</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          To access the platform, you need to connect your Solana wallet and hold the required AISTM7 tokens.
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!requirementInfo?.currentBalance || requirementInfo.shortfall > 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
        <h2 className="text-2xl font-bold">Insufficient AISTM7 Tokens</h2>
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg max-w-md">
          <p className="text-lg mb-4">
            Platform access requires ${requirementInfo?.targetUsdValue.toFixed(2)} USD worth of AISTM7 tokens
          </p>
          <div className="space-y-2 text-left">
            <div className="flex justify-between">
              <span>Required Amount:</span>
              <span className="font-mono">{requirementInfo?.requiredAmount.toLocaleString()} AISTM7</span>
            </div>
            <div className="flex justify-between">
              <span>Your Balance:</span>
              <span className="font-mono">{requirementInfo?.currentBalance.toLocaleString()} AISTM7</span>
            </div>
            <div className="flex justify-between text-red-500">
              <span>Shortfall:</span>
              <span className="font-mono">{requirementInfo?.shortfall.toLocaleString()} AISTM7</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Last requirement update: {requirementInfo?.lastUpdate.toLocaleString()}
          </div>
        </div>
        <a
          href="/payments"
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          Get AISTM7 Tokens
        </a>
      </div>
    );
  }

  return <>{children}</>;
};