import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

// AISTM7 token mint address (to be replaced with actual deployed token address)
const AISTM7_TOKEN_MINT = new PublicKey('YOUR_TOKEN_MINT_ADDRESS');
const MINIMUM_BALANCE = 700_000;

export interface TokenBalance {
  amount: number;
  meetsMinimum: boolean;
}

export async function getTokenBalance(walletAddress: string): Promise<TokenBalance> {
  const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
  const publicKey = new PublicKey(walletAddress);

  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: TOKEN_PROGRAM_ID,
    });

    const aistm7Account = tokenAccounts.value.find(
      account => account.account.data.parsed.info.mint === AISTM7_TOKEN_MINT.toString()
    );

    if (!aistm7Account) {
      return {
        amount: 0,
        meetsMinimum: false
      };
    }

    const balance = Number(aistm7Account.account.data.parsed.info.tokenAmount.amount) / LAMPORTS_PER_SOL;

    return {
      amount: balance,
      meetsMinimum: balance >= MINIMUM_BALANCE
    };
  } catch (error) {
    console.error('Error fetching token balance:', error);
    throw error;
  }
}

export async function getTokenPrice(): Promise<number> {
  try {
    // Replace with actual price feed integration
    const response = await fetch('/api/token/price');
    const data = await response.json();
    return data.price;
  } catch (error) {
    console.error('Error fetching token price:', error);
    throw error;
  }
}

export async function calculateMinimumTokens(targetUsdValue: number = 20): Promise<number> {
  try {
    const tokenPrice = await getTokenPrice();
    return Math.ceil(targetUsdValue / tokenPrice);
  } catch (error) {
    console.error('Error calculating minimum tokens:', error);
    throw error;
  }
}

export async function validateTokenAccess(walletAddress: string): Promise<{
  hasAccess: boolean;
  currentBalance: number;
  requiredBalance: number;
}> {
  try {
    const [balance, minimumTokens] = await Promise.all([
      getTokenBalance(walletAddress),
      calculateMinimumTokens()
    ]);

    return {
      hasAccess: balance.amount >= minimumTokens,
      currentBalance: balance.amount,
      requiredBalance: minimumTokens
    };
  } catch (error) {
    console.error('Error validating token access:', error);
    throw error;
  }
}

export async function watchTokenBalance(
  walletAddress: string,
  onBalanceChange: (balance: TokenBalance) => void
): Promise<() => void> {
  const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
  const publicKey = new PublicKey(walletAddress);

  // Set up account subscription
  const subscriptionId = connection.onAccountChange(
    publicKey,
    async () => {
      try {
        const balance = await getTokenBalance(walletAddress);
        onBalanceChange(balance);
      } catch (error) {
        console.error('Error in balance subscription:', error);
      }
    },
    'confirmed'
  );

  // Return cleanup function
  return () => {
    connection.removeAccountChangeListener(subscriptionId);
  };
}