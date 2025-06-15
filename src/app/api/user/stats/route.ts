import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClientSingleton } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.user.findUnique({
          where: { email: session.user.email }
        });
      },
      'fetch user for stats'
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user trading statistics
    const stats = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        // Get total trades (both as buyer and seller)
        const [buyTrades, sellTrades] = await Promise.all([
          prisma.trade.count({
            where: { buyerId: user.id }
          }),
          prisma.trade.count({
            where: { sellerId: user.id }
          })
        ]);

        // Get total volume (sum of all trade totals)
        const [buyVolume, sellVolume] = await Promise.all([
          prisma.trade.aggregate({
            where: { buyerId: user.id },
            _sum: { total: true }
          }),
          prisma.trade.aggregate({
            where: { sellerId: user.id },
            _sum: { total: true }
          })
        ]);

        // Get closed positions for P&L calculation
        const closedPositions = await prisma.position.findMany({
          where: {
            userId: user.id,
            closedAt: { not: null },
            exitPrice: { not: null }
          }
        });

        // Calculate total P&L from closed positions
        const totalPnL = closedPositions.reduce((sum, position) => {
          if (position.exitPrice) {
            const pnl = (position.exitPrice - position.entryPrice) * position.size * 
                       (position.type === 'LONG' ? 1 : -1);
            return sum + pnl;
          }
          return sum;
        }, 0);

        // Calculate win rate (positions that made profit)
        const profitablePositions = closedPositions.filter(position => {
          if (position.exitPrice) {
            const pnl = (position.exitPrice - position.entryPrice) * position.size * 
                       (position.type === 'LONG' ? 1 : -1);
            return pnl > 0;
          }
          return false;
        });

        const winRate = closedPositions.length > 0 
          ? (profitablePositions.length / closedPositions.length) * 100 
          : 0;

        // Get current open positions and orders
        const [openPositions, openOrders] = await Promise.all([
          prisma.position.count({
            where: {
              userId: user.id,
              closedAt: null
            }
          }),
          prisma.order.count({
            where: {
              userId: user.id,
              status: { in: ['PENDING', 'PARTIAL', 'OPEN'] }
            }
          })
        ]);

        return {
          totalTrades: buyTrades + sellTrades,
          totalVolume: (buyVolume._sum.total || 0) + (sellVolume._sum.total || 0),
          totalPnL,
          winRate,
          openPositions,
          openOrders
        };
      },
      'fetch user trading stats'
    );

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 