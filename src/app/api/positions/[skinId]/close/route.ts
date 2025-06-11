import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClientSingleton } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
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

    const { positionId } = await request.json();

    if (!positionId) {
      return NextResponse.json(
        { error: 'Position ID is required' },
        { status: 400 }
      );
    }

    // Find the position to close
    const position = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.position.findFirst({
          where: {
            id: positionId,
            userId: session.user.id,
            skinId: params.skinId,
            closedAt: null
          },
          include: {
            skin: true
          }
        });
      },
      'find position to close'
    );

    if (!position) {
      return NextResponse.json(
        { error: 'Position not found or already closed' },
        { status: 404 }
      );
    }

    // Calculate P&L
    const currentPrice = parseFloat(position.skin.price.toString());
    const entryPrice = parseFloat(position.entryPrice.toString());
    const size = parseFloat(position.size.toString());
    
    let pnl = 0;
    if (position.type === 'LONG') {
      pnl = (currentPrice - entryPrice) * size;
    } else {
      pnl = (entryPrice - currentPrice) * size;
    }

    // Close position and update user balance
    const [closedPosition] = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.$transaction([
          prisma.position.update({
            where: { id: positionId },
            data: {
              closedAt: new Date(),
              exitPrice: currentPrice
            }
          }),
          prisma.user.update({
            where: { id: session.user.id },
            data: {
              balance: {
                increment: pnl + position.margin // Return margin plus P&L
              }
            }
          })
        ]);
      },
      'close position and update balance'
    );

    return NextResponse.json({
      position: closedPosition,
      pnl: pnl,
      message: `Position closed with ${pnl >= 0 ? 'profit' : 'loss'} of $${Math.abs(pnl).toFixed(2)}`
    });

  } catch (error) {
    console.error('Error closing position:', error);
    return NextResponse.json(
      { error: 'Failed to close position' },
      { status: 500 }
    );
  }
} 