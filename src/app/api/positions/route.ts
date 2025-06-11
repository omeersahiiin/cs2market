import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClientSingleton } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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
    const existingPosition = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.position.findFirst({
          where: {
            skinId,
            userId: session.user.id,
            closedAt: null,
          },
        });
      },
      'fetch existing position'
    );

    if (existingPosition) {
      return new NextResponse('Position already exists for this skin', { status: 400 });
    }

    // Get user's current balance
    const user = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { balance: true },
        });
      },
      'fetch user balance'
    );

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
    const [position] = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.$transaction([
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
      },
      'create position and update balance'
    );

    return NextResponse.json(position);
  } catch (error) {
    console.error('Error creating position:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// GET /api/positions - Get all positions for the authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const positions = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.position.findMany({
          where: {
            userId: session.user.id
          },
          include: {
            skin: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
      },
      'fetch all user positions'
    );

    return NextResponse.json(positions);
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
} 