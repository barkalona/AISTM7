import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';

export async function generateBackupCodes(userId: string) {
  // Generate 10 backup codes
  const codes = Array.from({ length: 10 }, () => 
    randomBytes(4).toString('hex').toUpperCase().match(/.{1,4}/g)?.join('-')
  ).filter(Boolean) as string[];

  // Hash codes for secure storage
  const hashedCodes = await Promise.all(
    codes.map(code => bcrypt.hash(code, 10))
  );

  // Store hashed codes
  await prisma.user.update({
    where: { id: userId },
    data: {
      backupCodes: hashedCodes
    }
  });

  return codes;
}

export async function verifyBackupCode(userId: string, code: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { backupCodes: true }
  });

  if (!user?.backupCodes) {
    return false;
  }

  // Check if any backup code matches
  for (const hashedCode of user.backupCodes) {
    if (await bcrypt.compare(code, hashedCode)) {
      return true;
    }
  }

  return false;
}

export async function consumeBackupCode(userId: string, code: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { backupCodes: true }
  });

  if (!user?.backupCodes) {
    return false;
  }

  // Find and remove the used code
  const updatedCodes = [];
  let codeMatched = false;
  
  for (const hashedCode of user.backupCodes) {
    if (!codeMatched && await bcrypt.compare(code, hashedCode)) {
      codeMatched = true;
      continue;
    }
    updatedCodes.push(hashedCode);
  }

  if (!codeMatched) {
    return false;
  }

  // Update user with remaining codes
  await prisma.user.update({
    where: { id: userId },
    data: {
      backupCodes: updatedCodes
    }
  });

  return true;
}