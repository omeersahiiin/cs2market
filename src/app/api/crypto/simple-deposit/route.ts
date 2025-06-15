import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClientSingleton } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Your actual wallet addresses
const WALLET_ADDRESSES = {
  BTC: '1365feiMB5himtGcrhtPjH6tCzCfS7QJCG',
  ETH: '0x49cd0a247b5f8cb03df506473a7a60fe3ea56bba',
  USDT: 'TC49w5CVFdbsdxvoCSiWY4ANtCxFBbbC1Y', // TRC20
  SOL: 'HE7xDMhz4qHEvJL1vaT9eHpHDaGYAWQvqwniMTjBFLuU'
};

const CRYPTO_INFO = {
  BTC: { name: 'Bitcoin', network: 'Bitcoin', minDeposit: 0.001, icon: '₿' },
  ETH: { name: 'Ethereum', network: 'Ethereum', minDeposit: 0.01, icon: 'Ξ' },
  USDT: { name: 'Tether', network: 'Tron (TRC20)', minDeposit: 10, icon: '₮' },
  SOL: { name: 'Solana', network: 'Solana', minDeposit: 0.1, icon: '◎' }
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current balance
    const user = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { balance: true }
        });
      },
      'get user balance'
    );

    return NextResponse.json({
      wallets: Object.entries(WALLET_ADDRESSES).map(([symbol, address]) => ({
        symbol,
        address,
        ...CRYPTO_INFO[symbol as keyof typeof CRYPTO_INFO]
      })),
      currentBalance: user?.balance || 0,
      instructions: {
        step1: 'Choose your cryptocurrency',
        step2: 'Send the desired amount to our wallet address',
        step3: 'Contact support with transaction ID for manual confirmation',
        step4: 'Your balance will be credited after verification'
      }
    });

  } catch (error) {
    console.error('Error getting deposit info:', error);
    return NextResponse.json({
      error: 'Failed to get deposit information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, ...data } = await request.json();

    switch (action) {
      case 'manual-confirm':
        // Manual deposit confirmation (for admin use)
        const { userId, cryptoSymbol, amount, transactionId, usdValue } = data;
        
        if (!userId || !cryptoSymbol || !amount || !usdValue) {
          return NextResponse.json({
            error: 'Missing required fields: userId, cryptoSymbol, amount, usdValue'
          }, { status: 400 });
        }

        // Update user balance
        await PrismaClientSingleton.executeWithRetry(
          async (prisma) => {
            await prisma.user.update({
              where: { id: userId },
              data: {
                balance: {
                  increment: parseFloat(usdValue)
                }
              }
            });
          },
          'update user balance'
        );

        return NextResponse.json({
          message: 'Deposit confirmed successfully',
          userId,
          cryptoSymbol,
          amount,
          usdValue,
          transactionId
        });

      case 'get-rates':
        // Get current crypto to USD rates (mock data for now)
        const rates = {
          BTC: 43000,
          ETH: 2600,
          USDT: 1,
          SOL: 100
        };

        return NextResponse.json({
          rates,
          lastUpdated: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: ['manual-confirm', 'get-rates']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error processing deposit request:', error);
    return NextResponse.json({
      error: 'Failed to process deposit request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 