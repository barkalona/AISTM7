'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTokenPurchase } from '@/hooks/useTokenPurchase';
import { useTokenAccess } from '@/hooks/useTokenAccess';
import { formatUsdAmount, formatTokenAmount } from '@/services/tokenPurchase';

export default function TokenPurchaseForm() {
  const { publicKey } = useWallet();
  const { purchaseTokens, isLoading } = useTokenPurchase();
  const { price } = useTokenAccess();
  const [usdAmount, setUsdAmount] = useState('');
  const [estimatedTokens, setEstimatedTokens] = useState(0);

  const handleAmountChange = useCallback((value: string) => {
    setUsdAmount(value);
    if (!isNaN(Number(value)) && price > 0) {
      setEstimatedTokens(Math.floor(Number(value) / price));
    } else {
      setEstimatedTokens(0);
    }
  }, [price]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    const amount = Number(usdAmount);
    if (isNaN(amount) || amount <= 0) return;

    await purchaseTokens(amount);
    setUsdAmount('');
    setEstimatedTokens(0);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Purchase AISTM7 Tokens</h2>
      
      {/* Token Price Info */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-300">Current Price:</span>
          <span className="font-semibold">${price.toFixed(8)} USD</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount Input */}
        <div>
          <label htmlFor="usdAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount (USD)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              name="usdAmount"
              id="usdAmount"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="0.00"
              value={usdAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              min="0"
              step="0.01"
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">USD</span>
            </div>
          </div>
        </div>

        {/* Estimated Tokens */}
        {estimatedTokens > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">You will receive:</span>
              <span className="font-semibold">{formatTokenAmount(estimatedTokens)}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${!publicKey || isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          disabled={!publicKey || isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : !publicKey ? (
            'Connect Wallet to Purchase'
          ) : (
            'Purchase Tokens'
          )}
        </button>
      </form>

      {/* Requirements Notice */}
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>* Minimum purchase amount: {formatUsdAmount(20)}</p>
        <p>* Transactions are processed on the Solana blockchain</p>
        <p>* Token purchases are non-refundable</p>
      </div>
    </div>
  );
}