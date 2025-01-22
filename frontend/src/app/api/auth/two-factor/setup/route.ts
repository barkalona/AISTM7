import { NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { user } = await request.json();
    
    // Generate secret
    const secret = authenticator.generateSecret();
    
    // Generate OTP Auth URL
    const otpAuthUrl = authenticator.keyuri(
      user.email,
      'AISTM7',
      secret
    );

    // Generate QR Code
    const qrCodeUrl = await qrcode.toDataURL(otpAuthUrl);

    // Store secret temporarily in user record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: false
      }
    });

    return NextResponse.json(
      { qrCodeUrl, secret },
      { status: 200 }
    );
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { message: 'Failed to setup 2FA' },
      { status: 500 }
    );
  }
}