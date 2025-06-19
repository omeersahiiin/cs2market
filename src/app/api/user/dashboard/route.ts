import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClientSingleton } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface DashboardData {
  balance: number;
  stats: {
    totalTrades: number;
    totalVolume: number;
    totalPnL: number;
    winRate: number;
    openPositions: number;
    openOrders: number;
  };
  recentTransactions: Array<{
    id: string;
    type: 'TRADE' | 'POSITION_OPEN' | 'POSITION_CLOSE' | 'FEE' | 'DEPOSIT' | 'CRYPTO_DEPOSIT';
    amount: number;
    description: string;
    createdAt: string;
    skinName?: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dashboardData = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        // Single query to get user with basic info
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, balance: true }
        });

        if (!user) {
          throw new Error('User not found');
        }

        // Parallel execution of all data fetching
        const [
          tradesData,
          positionsData,
          ordersCount,
          recentTrades,
          recentPositions,
          cryptoDeposits
        ] = await Promise.all([
          // Get aggregated trade data in one query
          prisma.trade.groupBy({
            by: ['buyerId'],
            where: {
              OR: [
                { buyerId: user.id },
                { sellerId: user.id }
              ]
            },
            _count: { id: true },
            _sum: { total: true }
          }),
          
          // Get positions with P&L calculation
          prisma.position.findMany({
            where: { userId: user.id },
            select: {
              id: true,
              type: true,
              entryPrice: true,
              exitPrice: true,
              size: true,
              margin: true,
              closedAt: true,
              createdAt: true,
              skin: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit for performance
          }),
          
          // Count open orders
          prisma.order.count({
            where: {
              userId: user.id,
              status: { in: ['PENDING', 'PARTIAL', 'OPEN'] }
            }
          }),
          
          // Recent trades for transactions
          prisma.trade.findMany({
            where: {
              OR: [
                { buyerId: user.id },
                { sellerId: user.id }
              ]
            },
            include: { skin: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20
          }),
          
          // Recent positions for transactions (only significant ones)
          prisma.position.findMany({
            where: {
              userId: user.id,
              OR: [
                { closedAt: { not: null } }, // Closed positions
                { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // Recent opens
              ]
            },
            include: { skin: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 15
          }),
          
          // Recent crypto deposits
          prisma.cryptoDeposit.findMany({
            where: {
              userId: user.id,
              status: 'CREDITED'
            },
            orderBy: { creditedAt: 'desc' },
            take: 10
          })
        ]);

        // Calculate stats from fetched data
        const openPositions = positionsData.filter(p => !p.closedAt).length;
        const closedPositions = positionsData.filter(p => p.closedAt && p.exitPrice);
        
        // Calculate total P&L
        const totalPnL = closedPositions.reduce((sum, position) => {
          if (position.exitPrice) {
            const pnl = (position.exitPrice - position.entryPrice) * position.size * 
                       (position.type === 'LONG' ? 1 : -1);
            return sum + pnl;
          }
          return sum;
        }, 0);

        // Calculate win rate
        const profitablePositions = closedPositions.filter(position => {
          if (position.exitPrice) {
            const pnl = (position.exitPrice - position.entryPrice) * position.size * 
                       (position.type === 'LONG' ? 1 : -1);
            return pnl > 0;
          }
          return false;
        });

        const winRate = closedPositions.length > 0 
          ? Math.round((profitablePositions.length / closedPositions.length) * 100)
          : 0;

        // Process trade data
        const totalTrades = recentTrades.length; // Approximation for recent activity
        const totalVolume = recentTrades.reduce((sum, trade) => sum + trade.total, 0);

        // Build recent transactions efficiently
        const recentTransactions: DashboardData['recentTransactions'] = [];

        // Add recent trades
        recentTrades.slice(0, 10).forEach(trade => {
          const isBuyer = trade.buyerId === user.id;
          const amount = isBuyer ? -trade.total : trade.total;
          
          recentTransactions.push({
            id: `trade-${trade.id}`,
            type: 'TRADE',
            amount,
            description: `${isBuyer ? 'Bought' : 'Sold'} ${trade.quantity} ${trade.skin.name}`,
            createdAt: trade.createdAt.toISOString(),
            skinName: trade.skin.name
          });
        });

        // Add recent position closes
        closedPositions.slice(0, 5).forEach(position => {
          if (position.exitPrice && position.closedAt) {
            const pnl = (position.exitPrice - position.entryPrice) * position.size * 
                       (position.type === 'LONG' ? 1 : -1);
            
            recentTransactions.push({
              id: `position-close-${position.id}`,
              type: 'POSITION_CLOSE',
              amount: pnl,
              description: `Closed ${position.type} position: ${position.skin.name}`,
              createdAt: position.closedAt.toISOString(),
              skinName: position.skin.name
            });
          }
        });

        // Add recent crypto deposits
        cryptoDeposits.slice(0, 5).forEach(deposit => {
          if (deposit.usdValue && deposit.creditedAt) {
            recentTransactions.push({
              id: `crypto-deposit-${deposit.id}`,
              type: 'CRYPTO_DEPOSIT',
              amount: deposit.usdValue,
              description: `Crypto deposit: ${deposit.amount} ${deposit.cryptocurrency}`,
              createdAt: deposit.creditedAt.toISOString()
            });
          }
        });

        // Sort transactions by date and take top 15
        recentTransactions.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return {
          balance: user.balance,
          stats: {
            totalTrades,
            totalVolume,
            totalPnL,
            winRate,
            openPositions,
            openOrders: ordersCount
          },
          recentTransactions: recentTransactions.slice(0, 15)
        };
      },
      'fetch dashboard data'
    );

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 