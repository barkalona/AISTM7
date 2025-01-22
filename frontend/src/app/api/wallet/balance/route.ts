import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Connection, PublicKey } from '@solana/web3.js';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const walletAddress = request.headers.get('wallet-address');
    if (!walletAddress) {
      return new NextResponse('Bad Request: Missing wallet address', { status: 400 });
    }

    const connection = new Connection('https://api.mainnet-beta.solana.com');
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);

    return NextResponse.json({
      balance,
      minRequired: 700000,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}