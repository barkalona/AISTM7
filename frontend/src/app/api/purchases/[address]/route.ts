import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface PurchaseHistory {
  id: string;
  tokenAmount: number;
  solAmount: number;
  usdAmount: number;
  status: string;
  transactionSignature: string | null;
  createdAt: Date;
}

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { address } = params;

    // Verify the wallet belongs to the user
    const userResult = await prisma.$queryRaw<{ walletAddress: string | null }[]>`
      SELECT "walletAddress"
      FROM "User"
      WHERE id = ${session.user.id}
      LIMIT 1
    `;

    const user = userResult[0];
    if (!user || user.walletAddress !== address) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get purchase history
    const purchases = await prisma.$queryRaw<PurchaseHistory[]>`
      SELECT 
        id,
        "tokenAmount",
        "solAmount",
        "usdAmount",
        status,
        "transactionSignature",
        "createdAt"
      FROM "TokenPurchase"
      WHERE "userId" = ${session.user.id}
      ORDER BY "createdAt" DESC
    `;

    // Calculate statistics
    const totalTokens = purchases.reduce((sum, p) => 
      p.status === 'COMPLETED' ? sum + p.tokenAmount : sum, 
      0
    );

    const totalSpentSol = purchases.reduce((sum, p) => 
      p.status === 'COMPLETED' ? sum + p.solAmount : sum, 
      0
    );

    const totalSpentUsd = purchases.reduce((sum, p) => 
      p.status === 'COMPLETED' ? sum + p.usdAmount : sum, 
      0
    );

    const response = {
      purchases: purchases.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      })),
      statistics: {
        totalTokens,
        totalSpentSol,
        totalSpentUsd,
        totalTransactions: purchases.filter(p => p.status === 'COMPLETED').length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { address } = params;
    const body = await request.json();
    const { tokenAmount, solAmount, usdAmount, transactionSignature } = body;

    if (!tokenAmount || !solAmount || !usdAmount) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Verify the wallet belongs to the user
    const userResult = await prisma.$queryRaw<{ walletAddress: string | null }[]>`
      SELECT "walletAddress"
      FROM "User"
      WHERE id = ${session.user.id}
      LIMIT 1
    `;

    const user = userResult[0];
    if (!user || user.walletAddress !== address) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Create purchase record
    const purchase = await prisma.$queryRaw<PurchaseHistory[]>`
      INSERT INTO "TokenPurchase" (
        "userId",
        "tokenAmount",
        "solAmount",
        "usdAmount",
        "status",
        "transactionSignature",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${session.user.id},
        ${tokenAmount},
        ${solAmount},
        ${usdAmount},
        'PENDING',
        ${transactionSignature || null},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    return NextResponse.json(purchase[0]);
  } catch (error) {
    console.error('Error creating purchase record:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}