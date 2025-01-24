import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const walletAddress = params.address;
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    );

    // Get the token mint address
    const tokenMint = new PublicKey(process.env.NEXT_PUBLIC_AISTM7_TOKEN_MINT!);
    const wallet = new PublicKey(walletAddress);

    // Get the token state account to read the current requirement
    const [tokenStateAddress] = await PublicKey.findProgramAddress(
      [Buffer.from('token_state')],
      new PublicKey(process.env.NEXT_PUBLIC_AISTM7_PROGRAM_ID!)
    );

    const tokenStateAccount = await connection.getAccountInfo(tokenStateAddress);
    if (!tokenStateAccount) {
      throw new Error('Token state account not found');
    }

    // Parse the token state data to get the current requirement
    // The current_requirement field is at offset 88 (after authority and mint pubkeys)
    const currentRequirement = tokenStateAccount.data.readBigUInt64LE(88);

    // Get the user's token account
    const tokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      wallet
    );

    // Get the token account info
    const accountInfo = await connection.getTokenAccountBalance(tokenAccount);
    const balance = BigInt(accountInfo.value.amount);

    // Check if the balance meets the requirement
    const hasRequiredBalance = balance >= currentRequirement;
    const shortfall = hasRequiredBalance ? 0 : Number(currentRequirement - balance);

    return NextResponse.json({
      hasRequiredBalance,
      currentBalance: Number(balance),
      requiredAmount: Number(currentRequirement),
      shortfall,
      lastChecked: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error checking token balance:', error);
    
    // Handle case where token account doesn't exist yet
    if ((error as any).message?.includes('TokenAccountNotFound')) {
      return NextResponse.json({
        hasRequiredBalance: false,
        currentBalance: 0,
        requiredAmount: 0, // Will be fetched from token state in next request
        shortfall: 0,
        lastChecked: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: 'Failed to check token balance' },
      { status: 500 }
    );
  }
}

// Revalidate every minute
export const revalidate = 60;