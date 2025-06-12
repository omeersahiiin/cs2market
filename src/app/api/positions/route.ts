import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClientSingleton } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { shouldUseMockData, MOCK_SKINS, getMockPositions, addMockPosition } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

// Mock positions data
const MOCK_POSITIONS = [
  {
    id: 'pos-1',
    skinId: 'skin-1',
    userId: 'mock-user-1',
    type: 'LONG',
    entryPrice: 7450.00,
    size: 2,
    margin: 2980.00,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    closedAt: null,
    exitPrice: null,
    skin: MOCK_SKINS[0] // AWP Dragon Lore
  },
  {
    id: 'pos-2',
    skinId: 'skin-2',
    userId: 'mock-user-1',
    type: 'SHORT',
    entryPrice: 1280.00,
    size: 5,
    margin: 1280.00,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    closedAt: null,
    exitPrice: null,
    skin: MOCK_SKINS[1] // AK-47 Fire Serpent
  },
  {
    id: 'pos-3',
    skinId: 'skin-3',
    userId: 'mock-user-1',
    type: 'LONG',
    entryPrice: 155.00,
    size: 10,
    margin: 310.00,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    closedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // Closed 1 hour ago
    exitPrice: 151.25,
    skin: MOCK_SKINS[2] // AWP Asiimov
  }
];

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

    // Check if we should use mock data
    if (shouldUseMockData()) {
      console.log('Creating mock position');
      
      // Find the skin
      const skin = MOCK_SKINS.find(s => s.id === skinId);
      if (!skin) {
        return new NextResponse('Skin not found', { status: 404 });
      }

      // Calculate required margin (20% of position value)
      const positionValue = entryPrice * size;
      const requiredMargin = positionValue * 0.2;

      // Create mock position
      const newPosition = {
        id: `pos-${Date.now()}`,
        skinId,
        userId: session.user.id,
        type,
        entryPrice,
        size,
        margin: requiredMargin,
        createdAt: new Date().toISOString(),
        closedAt: null,
        exitPrice: null,
        skin
      };

      // Add to mock positions
      addMockPosition(newPosition);

      return NextResponse.json(newPosition);
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

    // Check if we should use mock data
    if (shouldUseMockData()) {
      console.log('Using mock positions data');
      
      // Get positions for the current user
      const userPositions = getMockPositions(session.user.id);
      
      return NextResponse.json(userPositions);
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