import { NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import prisma from '@/lib/prisma';
import { createSession } from '@/lib/session';
import { verifyBackupCode, consumeBackupCode } from '@/lib/backup-codes';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        { message: 'Invalid request' },
        { status: 400 }
      );
    }

    // First try to verify as a backup code
    const isBackupCode = await verifyBackupCode(user.id, code);
    
    if (isBackupCode) {
      // Consume the backup code
      await consumeBackupCode(user.id, code);
    } else {
      // Verify as a TOTP code
      const isValid = authenticator.check(code, user.twoFactorSecret);
      
      if (!isValid) {
        return NextResponse.json(
          { message: 'Invalid verification code' },
          { status: 400 }
        );
      }
    }

    // Create session
    const session = await createSession(user);

    return NextResponse.json(
      {
        message: 'Two-factor authentication verified',
        session
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { message: 'Failed to verify 2FA code' },
      { status: 500 }
    );
  }
}