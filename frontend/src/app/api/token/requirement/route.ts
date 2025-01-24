import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

export async function GET() {
  try {
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    );

    // Get the token state account to read the current requirement
    const [tokenStateAddress] = await PublicKey.findProgramAddress(
      [Buffer.from('token_state')],
      new PublicKey(process.env.NEXT_PUBLIC_AISTM7_PROGRAM_ID!)
    );

    const tokenStateAccount = await connection.getAccountInfo(tokenStateAddress);
    if (!tokenStateAccount) {
      throw new Error('Token state account not found');
    }

    // Parse the token state data
    // Layout:
    // - authority: Pubkey (32 bytes)
    // - mint: Pubkey (32 bytes)
    // - target_usd_value: u64 (8 bytes)
    // - min_tokens: u64 (8 bytes)
    // - max_tokens: u64 (8 bytes)
    // - current_requirement: u64 (8 bytes)
    // - last_update: i64 (8 bytes)
    const data = tokenStateAccount.data;
    const targetUsdValue = Number(data.readBigUInt64LE(64)) / 1_000_000; // Convert from millionths
    const currentRequirement = Number(data.readBigUInt64LE(88));
    const lastUpdate = new Date(Number(data.readBigInt64LE(96)) * 1000);

    return NextResponse.json({
      requiredAmount: currentRequirement,
      targetUsdValue,
      lastUpdate: lastUpdate.toISOString(),
      minTokens: Number(data.readBigUInt64LE(72)),
      maxTokens: Number(data.readBigUInt64LE(80)),
    });
  } catch (error) {
    console.error('Error fetching token requirement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token requirement' },
      { status: 500 }
    );
  }
}

// Revalidate every minute
export const revalidate = 60;