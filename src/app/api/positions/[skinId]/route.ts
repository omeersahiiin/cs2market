import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClientSingleton } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/positions/[skinId] - Get positions for a specific skin
export async function GET(
  request: Request,
  { params }: { params: { skinId: string } }
) {
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
            skinId: params.skinId,
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
      'fetch user positions for skin'
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