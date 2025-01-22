import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { CreateAlertInput } from '@/types/alerts';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const alerts = await prisma.alert.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { type, threshold, condition } = body as CreateAlertInput;

    if (!type || typeof threshold !== 'number' || !condition) {
      return new NextResponse('Invalid request body', { status: 400 });
    }

    // Validate alert type
    const validTypes = ['risk_level', 'portfolio_value', 'volatility'];
    if (!validTypes.includes(type)) {
      return new NextResponse('Invalid alert type', { status: 400 });
    }

    // Validate condition
    const validConditions = ['above', 'below'];
    if (!validConditions.includes(condition)) {
      return new NextResponse('Invalid condition', { status: 400 });
    }

    const alert = await prisma.alert.create({
      data: {
        type,
        threshold,
        condition,
        userId: session.user.id,
        enabled: true
      }
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error creating alert:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}