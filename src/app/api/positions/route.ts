import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { skinId, type, entryPrice, size } = await request.json();

    // Validate input
    if (!skinId || !type || !entryPrice || !size) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    if (type !== 'LONG' && type !== 'SHORT') {
      return new NextResponse('Invalid position type', { status: 400 });
    }

    if (size <= 0) {
      return new NextResponse('Size must be greater than 0', { status: 400 });
    }

    // Check if user already has a position for this skin
    const existingPosition = await prisma.position.findFirst({
      where: {
        skinId,
        userId: session.user.id,
        closedAt: null,
      },
    });

    if (existingPosition) {
      return new NextResponse('Position already exists for this skin', { status: 400 });
    }

    // Get user's current balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Calculate required margin (20% of position value)
    const positionValue = entryPrice * size;
    const requiredMargin = positionValue * 0.2;

    if (user.balance < requiredMargin) {
      return new NextResponse('Insufficient balance', { status: 400 });
    }

    // Create position and update user balance in a transaction
    const [position] = await prisma.$transaction([
      prisma.position.create({
        data: {
          skinId,
          userId: session.user.id,
          type,
          entryPrice,
          size,
          margin: requiredMargin,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { balance: { decrement: requiredMargin } },
      }),
    ]);

    return NextResponse.json(position);
  } catch (error) {
    console.error('Error creating position:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const skinId = searchParams.get('skinId');
    const all = searchParams.get('all');

    const positions = await prisma.position.findMany({
      where: {
        userId: session.user.id,
        ...(skinId ? { skinId } : {}),
        ...(all ? {} : { closedAt: null }),
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
    console.error('Error fetching positions:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 