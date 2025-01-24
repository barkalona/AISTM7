import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

// Pyth price feed address for AISTM7/USD
const PRICE_FEED_ADDRESS = process.env.NEXT_PUBLIC_AISTM7_PRICE_FEED!;

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

    // Get the current price from Pyth
    const priceFeedAccount = await connection.getAccountInfo(
      new PublicKey(PRICE_FEED_ADDRESS)
    );
    if (!priceFeedAccount) {
      throw new Error('Price feed account not found');
    }

    // Parse the price feed data (price is in USD with 6 decimal places)
    const price = priceFeedAccount.data.readBigInt64LE(0) / BigInt(1_000_000);

    // Calculate the required token amount based on $15 target
    const TARGET_USD_VALUE = 15; // $15 USD
    const requiredTokens = Math.ceil(TARGET_USD_VALUE / Number(price));

    return NextResponse.json({
      price: Number(price),
      lastUpdate: new Date().toISOString(),
      requiredTokens,
      targetUsdValue: TARGET_USD_VALUE,
    });
  } catch (error) {
    console.error('Error fetching token price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token price' },
      { status: 500 }
    );
  }
}

// Update price every 5 minutes
export const revalidate = 300;