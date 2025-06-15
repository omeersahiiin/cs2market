import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClientSingleton } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Test endpoint to simulate crypto deposit confirmation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { depositId, amount } = await request.json();

    if (!depositId || !amount) {
      return NextResponse.json({ 
        error: 'Missing required fields: depositId, amount' 
      }, { status: 400 });
    }

    // Find the deposit
    const deposit = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.cryptoDeposit.findUnique({
          where: { id: depositId },
          include: { user: true }
        });
      },
      'fetch deposit for test confirmation'
    );

    if (!deposit) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
    }

    if (deposit.status === 'CREDITED') {
      return NextResponse.json({ error: 'Deposit already credited' }, { status: 400 });
    }

    // Mock crypto prices for testing
    const mockPrices: { [key: string]: number } = {
      'BTC': 45000,
      'ETH': 2500,
      'USDT': 1,
      'SOL': 100
    };

    const cryptoPrice = mockPrices[deposit.cryptocurrency] || 1;
    const usdValue = amount * cryptoPrice;
    const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;

    // Update deposit and credit user balance in a transaction
    await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        // Update deposit
        await prisma.cryptoDeposit.update({
          where: { id: depositId },
          data: {
            txHash: mockTxHash,
            amount: parseFloat(amount),
            usdValue,
            confirmations: deposit.requiredConfirmations,
            status: 'CREDITED',
            creditedAt: new Date()
          }
        });

        // Credit user balance
        await prisma.user.update({
          where: { id: deposit.userId },
          data: {
            balance: {
              increment: usdValue
            }
          }
        });
      },
      'test confirm deposit and credit balance'
    );

    return NextResponse.json({
      message: 'Test deposit confirmed and credited successfully',
      deposit: {
        id: depositId,
        amount: parseFloat(amount),
        usdValue,
        txHash: mockTxHash,
        status: 'CREDITED'
      }
    });

  } catch (error) {
    console.error('Error in test deposit confirmation:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 