import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Maximum tokens that can be purchased per day
const DAILY_PURCHASE_LIMIT = 1_000_000;

interface AllowanceRequest {
  walletAddress: string;
  amount: number;
}

interface AllowanceResponse {
  allowed: boolean;
  reason?: string;
  dailyLimit?: number;
  remainingToday?: number;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json() as AllowanceRequest;
    const { walletAddress, amount } = body;

    if (!walletAddress || !amount) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Get today's purchases
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todaysPurchases = await prisma.$queryRaw<{ tokenAmount: number }[]>`
      SELECT "tokenAmount"
      FROM "TokenPurchase"
      WHERE "userId" = ${session.user.id}
      AND "createdAt" >= ${startOfDay}
      AND "status" = 'COMPLETED'
    `;

    const totalPurchasedToday = todaysPurchases.reduce(
      (sum, purchase) => sum + purchase.tokenAmount,
      0
    );

    // Check if purchase would exceed daily limit
    if (totalPurchasedToday + amount > DAILY_PURCHASE_LIMIT) {
      const response: AllowanceResponse = {
        allowed: false,
        reason: 'Daily purchase limit exceeded',
        dailyLimit: DAILY_PURCHASE_LIMIT,
        remainingToday: DAILY_PURCHASE_LIMIT - totalPurchasedToday,
      };
      return NextResponse.json(response);
    }

    // Check if wallet is verified and matches
    const userResult = await prisma.$queryRaw<{ walletVerified: boolean, walletAddress: string | null }[]>`
      SELECT "walletVerified", "walletAddress"
      FROM "User"
      WHERE id = ${session.user.id}
      LIMIT 1
    `;

    const user = userResult[0];
    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    if (!user.walletVerified) {
      const response: AllowanceResponse = {
        allowed: false,
        reason: 'Wallet not verified',
      };
      return NextResponse.json(response);
    }

    if (user.walletAddress !== walletAddress) {
      const response: AllowanceResponse = {
        allowed: false,
        reason: 'Wallet address does not match registered address',
      };
      return NextResponse.json(response);
    }

    // Additional checks could be added here:
    // - KYC status
    // - Account age
    // - Previous purchase history
    // - Risk assessment

    const response: AllowanceResponse = {
      allowed: true,
      dailyLimit: DAILY_PURCHASE_LIMIT,
      remainingToday: DAILY_PURCHASE_LIMIT - totalPurchasedToday,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error checking purchase allowance:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}