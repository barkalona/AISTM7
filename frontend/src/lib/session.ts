import { NextResponse } from 'next/server';
import { signIn } from 'next-auth/react';
import prisma from '@/lib/prisma';

export async function createSession(user: any) {
  // Create session token
  const sessionToken = require('crypto').randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Create session in database
  await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires
    }
  });

  // Sign in with NextAuth
  await signIn('credentials', {
    redirect: false,
    email: user.email,
    sessionToken
  });

  return {
    sessionToken,
    expires
  };
}