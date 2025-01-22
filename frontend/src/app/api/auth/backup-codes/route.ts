import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { backupCodes: true }
  });

  if (!user) {
    return NextResponse.json(
      { message: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { codes: user.backupCodes },
    { status: 200 }
  );
}