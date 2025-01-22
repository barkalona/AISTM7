import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return new NextResponse('Invalid request body', { status: 400 });
    }

    const alert = await prisma.alert.findUnique({
      where: { id: params.id }
    });

    if (!alert || alert.userId !== session.user.id) {
      return new NextResponse('Alert not found', { status: 404 });
    }

    const updatedAlert = await prisma.alert.update({
      where: { id: params.id },
      data: { enabled }
    });

    return NextResponse.json(updatedAlert);
  } catch (error) {
    console.error('Error updating alert:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const alert = await prisma.alert.findUnique({
      where: { id: params.id }
    });

    if (!alert || alert.userId !== session.user.id) {
      return new NextResponse('Alert not found', { status: 404 });
    }

    await prisma.alert.delete({
      where: { id: params.id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}