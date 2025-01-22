import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

// AISTM7 token mint address (to be replaced with actual deployed token address)
const AISTM7_TOKEN_MINT = new PublicKey('YOUR_TOKEN_MINT_ADDRESS');
// Treasury wallet that receives payments
const TREASURY_WALLET = new PublicKey('YOUR_TREASURY_WALLET_ADDRESS');

interface PurchaseQuote {
  tokenAmount: number;
  solAmount: number;
  usdAmount: number;
  fee: number;
}

export async function getTokenPurchaseQuote(usdAmount: number): Promise<PurchaseQuote> {
  try {
    const response = await fetch('/api/token/price');
    if (!response.ok) throw new Error('Failed to fetch token price');
    
    const { price } = await response.json();
    const tokenAmount = Math.ceil(usdAmount / price);
    
    // Get current SOL price for conversion
    const solPriceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const { solana: { usd: solPrice } } = await solPriceResponse.json();
    
    const solAmount = usdAmount / solPrice;
    const fee = solAmount * 0.01; // 1% fee

    return {
      tokenAmount,
      solAmount: solAmount + fee,
      usdAmount,
      fee
    };
  } catch (error) {
    console.error('Error getting purchase quote:', error);
    throw error;
  }
}

export async function createPurchaseTransaction(
  buyerAddress: string,
  quote: PurchaseQuote
): Promise<Transaction> {
  const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
  const buyer = new PublicKey(buyerAddress);

  try {
    const transaction = new Transaction();

    // Add SOL transfer instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: buyer,
        toPubkey: TREASURY_WALLET,
        lamports: Math.floor(quote.solAmount * LAMPORTS_PER_SOL),
      })
    );

    // Get the buyer's associated token account
    const buyerTokenAccount = await connection.getParsedTokenAccountsByOwner(buyer, {
      mint: AISTM7_TOKEN_MINT,
    });

    // If buyer doesn't have a token account, create one
    if (buyerTokenAccount.value.length === 0) {
      // Add create associated token account instruction
      // Note: This requires the associated-token-account program
      // Implementation depends on whether you're using the SPL token program directly
      // or a custom token program
    }

    // Add token transfer instruction
    // Note: This requires your custom token program instructions
    // Implementation depends on your token contract's specific implementation

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = buyer;

    return transaction;
  } catch (error) {
    console.error('Error creating purchase transaction:', error);
    throw error;
  }
}

export async function confirmTransaction(signature: string): Promise<boolean> {
  const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
  
  try {
    const result = await connection.confirmTransaction(signature);
    return result.value.err === null;
  } catch (error) {
    console.error('Error confirming transaction:', error);
    throw error;
  }
}

export async function getPurchaseHistory(walletAddress: string) {
  try {
    const response = await fetch(`/api/purchases/${walletAddress}`);
    if (!response.ok) throw new Error('Failed to fetch purchase history');
    return await response.json();
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    throw error;
  }
}

interface TokenAllowance {
  allowed: boolean;
  reason?: string;
  dailyLimit?: number;
  remainingToday?: number;
}

export async function checkPurchaseAllowance(
  walletAddress: string,
  amount: number
): Promise<TokenAllowance> {
  try {
    const response = await fetch('/api/token/allowance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        amount,
      }),
    });

    if (!response.ok) throw new Error('Failed to check purchase allowance');
    return await response.json();
  } catch (error) {
    console.error('Error checking purchase allowance:', error);
    throw error;
  }
}

// Utility function to format SOL amounts
export function formatSolAmount(amount: number): string {
  return `${amount.toFixed(4)} SOL`;
}

// Utility function to format USD amounts
export function formatUsdAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Utility function to format token amounts
export function formatTokenAmount(amount: number): string {
  return `${amount.toLocaleString()} AISTM7`;
}