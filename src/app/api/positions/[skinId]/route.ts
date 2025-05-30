import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { skinId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const positions = await prisma.position.findMany({
      where: {
        skinId: params.skinId,
        userId: session.user.id,
        closedAt: null,
      },
      include: {
        skin: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(positions);
  } catch (error) {
    console.error('Error fetching position:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 