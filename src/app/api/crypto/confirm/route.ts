import { NextRequest, NextResponse } from 'next/server';
import { PrismaClientSingleton } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Mock function to get crypto price in USD (replace with real price API)
async function getCryptoPriceUSD(cryptocurrency: string): Promise<number> {
  // This is a placeholder - integrate with CoinGecko, CoinMarketCap, or similar
  const mockPrices: { [key: string]: number } = {
    'BTC': 45000,
    'ETH': 2500,
    'USDT': 1,
    'SOL': 100
  };
  
  return mockPrices[cryptocurrency.toUpperCase()] || 1;
}

// Confirm a crypto deposit (called by webhook or manual admin action)
export async function POST(request: NextRequest) {
  try {
    const { 
      depositId, 
      txHash, 
      amount, 
      confirmations = 1 
    } = await request.json();

    if (!depositId || !txHash || !amount) {
      return NextResponse.json({ 
        error: 'Missing required fields: depositId, txHash, amount' 
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
      'fetch deposit for confirmation'
    );

    if (!deposit) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
    }

    if (deposit.status === 'CREDITED') {
      return NextResponse.json({ error: 'Deposit already credited' }, { status: 400 });
    }

    // Get current crypto price
    const cryptoPrice = await getCryptoPriceUSD(deposit.cryptocurrency);
    const usdValue = amount * cryptoPrice;

    // Update deposit with confirmation details
    const updatedDeposit = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.cryptoDeposit.update({
          where: { id: depositId },
          data: {
            txHash,
            amount,
            usdValue,
            confirmations,
            status: confirmations >= deposit.requiredConfirmations ? 'CONFIRMED' : 'PENDING'
          }
        });
      },
      'update deposit confirmation'
    );

    // If enough confirmations, credit the user's balance
    if (confirmations >= deposit.requiredConfirmations && deposit.status !== 'CREDITED') {
      await PrismaClientSingleton.executeWithRetry(
        async (prisma) => {
          // Credit user balance
          await prisma.user.update({
            where: { id: deposit.userId },
            data: {
              balance: {
                increment: usdValue
              }
            }
          });

          // Mark deposit as credited
          await prisma.cryptoDeposit.update({
            where: { id: depositId },
            data: {
              status: 'CREDITED',
              creditedAt: new Date()
            }
          });
        },
        'credit user balance'
      );

      return NextResponse.json({
        message: 'Deposit confirmed and credited',
        deposit: {
          id: depositId,
          amount,
          usdValue,
          status: 'CREDITED'
        }
      });
    }

    return NextResponse.json({
      message: 'Deposit updated, waiting for more confirmations',
      deposit: {
        id: depositId,
        amount,
        usdValue,
        confirmations,
        requiredConfirmations: deposit.requiredConfirmations,
        status: updatedDeposit.status
      }
    });

  } catch (error) {
    console.error('Error confirming deposit:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get deposit status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const depositId = searchParams.get('depositId');

    if (!depositId) {
      return NextResponse.json({ error: 'Missing depositId parameter' }, { status: 400 });
    }

    const deposit = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.cryptoDeposit.findUnique({
          where: { id: depositId }
        });
      },
      'fetch deposit status'
    );

    if (!deposit) {
      return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
    }

    return NextResponse.json({
      deposit: {
        id: deposit.id,
        cryptocurrency: deposit.cryptocurrency,
        network: deposit.network,
        depositAddress: deposit.depositAddress,
        amount: deposit.amount,
        usdValue: deposit.usdValue,
        txHash: deposit.txHash,
        status: deposit.status,
        confirmations: deposit.confirmations,
        requiredConfirmations: deposit.requiredConfirmations,
        createdAt: deposit.createdAt,
        creditedAt: deposit.creditedAt,
        expiresAt: deposit.expiresAt
      }
    });

  } catch (error) {
    console.error('Error fetching deposit status:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 