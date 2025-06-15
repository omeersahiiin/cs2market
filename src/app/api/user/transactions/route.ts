import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClientSingleton } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface Transaction {
  id: string;
  type: 'TRADE' | 'POSITION_OPEN' | 'POSITION_CLOSE' | 'FEE' | 'DEPOSIT';
  amount: number;
  description: string;
  createdAt: string;
  skinName?: string;
}

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
      'fetch user for transactions'
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const transactions = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        const allTransactions: Transaction[] = [];

        // Get trades (both as buyer and seller)
        const trades = await prisma.trade.findMany({
          where: {
            OR: [
              { buyerId: user.id },
              { sellerId: user.id }
            ]
          },
          include: {
            skin: true
          },
          orderBy: { createdAt: 'desc' },
          take: 50 // Limit to recent 50 transactions
        });

        // Add trade transactions
        trades.forEach(trade => {
          const isBuyer = trade.buyerId === user.id;
          const amount = isBuyer ? -trade.total : trade.total; // Negative for buying, positive for selling
          
          allTransactions.push({
            id: `trade-${trade.id}`,
            type: 'TRADE',
            amount,
            description: `${isBuyer ? 'Bought' : 'Sold'} ${trade.quantity} ${trade.skin.name}`,
            createdAt: trade.createdAt.toISOString(),
            skinName: trade.skin.name
          });

          // Add trading fee (0.02% of trade value)
          const fee = trade.total * 0.0002;
          allTransactions.push({
            id: `fee-${trade.id}`,
            type: 'FEE',
            amount: -fee,
            description: `Trading fee for ${trade.skin.name}`,
            createdAt: trade.createdAt.toISOString(),
            skinName: trade.skin.name
          });
        });

        // Get closed positions for P&L
        const closedPositions = await prisma.position.findMany({
          where: {
            userId: user.id,
            closedAt: { not: null },
            exitPrice: { not: null }
          },
          include: {
            skin: true
          },
          orderBy: { closedAt: 'desc' },
          take: 25
        });

        // Add position close transactions
        closedPositions.forEach(position => {
          if (position.exitPrice && position.closedAt) {
            const pnl = (position.exitPrice - position.entryPrice) * position.size * 
                       (position.type === 'LONG' ? 1 : -1);
            
            allTransactions.push({
              id: `position-close-${position.id}`,
              type: 'POSITION_CLOSE',
              amount: pnl,
              description: `Closed ${position.type} position: ${position.skin.name} (${pnl >= 0 ? 'Profit' : 'Loss'})`,
              createdAt: position.closedAt.toISOString(),
              skinName: position.skin.name
            });
          }
        });

        // Get recent position opens
        const openPositions = await prisma.position.findMany({
          where: {
            userId: user.id
          },
          include: {
            skin: true
          },
          orderBy: { createdAt: 'desc' },
          take: 25
        });

        // Add position open transactions (margin used)
        openPositions.forEach(position => {
          allTransactions.push({
            id: `position-open-${position.id}`,
            type: 'POSITION_OPEN',
            amount: -position.margin, // Negative because margin is locked
            description: `Opened ${position.type} position: ${position.skin.name} (Margin: $${position.margin.toFixed(2)})`,
            createdAt: position.createdAt.toISOString(),
            skinName: position.skin.name
          });
        });

        // Add initial deposit transaction for new users
        if (allTransactions.length === 0) {
          allTransactions.push({
            id: `deposit-initial`,
            type: 'DEPOSIT',
            amount: 10000,
            description: 'Initial account deposit',
            createdAt: user.createdAt.toISOString()
          });
        }

        // Sort all transactions by date (newest first)
        return allTransactions.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 50); // Keep only the 50 most recent
      },
      'fetch user transactions'
    );

    return NextResponse.json({ transactions });

  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 