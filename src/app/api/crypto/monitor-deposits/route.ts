import { NextResponse } from 'next/server';
import { PrismaClientSingleton } from '@/lib/prisma';
import { binanceAPI } from '@/lib/binance-api';

export const dynamic = 'force-dynamic';

// Map our crypto symbols to Binance symbols
const CRYPTO_MAPPING = {
  'BTC': 'BTC',
  'ETH': 'ETH', 
  'USDT': 'USDT',
  'SOL': 'SOL'
};

// USD conversion rates (you might want to get these from an API)
const USD_RATES = {
  'BTC': 43000,
  'ETH': 2600,
  'USDT': 1,
  'SOL': 100
};

export async function POST() {
  try {
    console.log('🔍 Starting deposit monitoring...');

    // Validate Binance API credentials
    const isValidCredentials = await binanceAPI.validateCredentials();
    if (!isValidCredentials) {
      return NextResponse.json({
        error: 'Invalid Binance API credentials',
        message: 'Please check your BINANCE_API_KEY and BINANCE_SECRET_KEY environment variables'
      }, { status: 400 });
    }

    // Get last check time from database or use 24 hours ago
    const lastCheckTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

    // Check for new deposits
    const newDeposits = await binanceAPI.checkNewDeposits(lastCheckTime);
    console.log(`Found ${newDeposits.length} new deposits`);

    let processedDeposits = 0;
    const results = [];

    for (const deposit of newDeposits) {
      try {
        // Find matching pending deposit in our database
        const pendingDeposit = await PrismaClientSingleton.executeWithRetry(
          async (prisma) => {
            return await prisma.cryptoDeposit.findFirst({
              where: {
                status: 'PENDING',
                cryptoSymbol: deposit.coin,
                // Match by address or transaction ID
                OR: [
                  { depositAddress: deposit.address },
                  { transactionId: deposit.txId }
                ]
              },
              include: {
                user: true
              }
            });
          },
          'find pending deposit'
        );

        if (!pendingDeposit) {
          console.log(`No matching pending deposit found for ${deposit.coin} - ${deposit.txId}`);
          continue;
        }

        // Calculate USD value
        const cryptoAmount = parseFloat(deposit.amount);
        const usdRate = USD_RATES[deposit.coin as keyof typeof USD_RATES] || 1;
        const usdValue = cryptoAmount * usdRate;

        // Update deposit status and user balance
        await PrismaClientSingleton.executeWithRetry(
          async (prisma) => {
            // Update deposit record
            await prisma.cryptoDeposit.update({
              where: { id: pendingDeposit.id },
              data: {
                status: 'CONFIRMED',
                actualAmount: cryptoAmount,
                usdValue: usdValue,
                transactionId: deposit.txId,
                confirmations: parseInt(deposit.confirmTimes) || 0,
                confirmedAt: new Date(deposit.insertTime)
              }
            });

            // Update user balance
            await prisma.user.update({
              where: { id: pendingDeposit.userId },
              data: {
                balance: {
                  increment: usdValue
                }
              }
            });

            console.log(`✅ Confirmed deposit: ${cryptoAmount} ${deposit.coin} ($${usdValue.toFixed(2)}) for user ${pendingDeposit.userId}`);
          },
          'confirm deposit and update balance'
        );

        processedDeposits++;
        results.push({
          depositId: pendingDeposit.id,
          userId: pendingDeposit.userId,
          coin: deposit.coin,
          amount: cryptoAmount,
          usdValue: usdValue,
          txId: deposit.txId,
          status: 'confirmed'
        });

      } catch (error) {
        console.error(`Error processing deposit ${deposit.txId}:`, error);
        results.push({
          txId: deposit.txId,
          coin: deposit.coin,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${processedDeposits} deposits`,
      totalFound: newDeposits.length,
      processed: processedDeposits,
      results: results
    });

  } catch (error) {
    console.error('Error monitoring deposits:', error);
    return NextResponse.json({
      error: 'Failed to monitor deposits',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check monitoring status
export async function GET() {
  try {
    const isValidCredentials = await binanceAPI.validateCredentials();
    
    if (!isValidCredentials) {
      return NextResponse.json({
        status: 'error',
        message: 'Binance API credentials not configured or invalid'
      });
    }

    // Get recent deposit activity
    const recentDeposits = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.cryptoDeposit.findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: { email: true }
            }
          }
        });
      },
      'get recent deposits'
    );

    return NextResponse.json({
      status: 'active',
      message: 'Deposit monitoring is active',
      binanceApiStatus: 'connected',
      recentDeposits: recentDeposits.length,
      lastDeposits: recentDeposits.map(deposit => ({
        id: deposit.id,
        coin: deposit.cryptoSymbol,
        amount: deposit.expectedAmount,
        status: deposit.status,
        createdAt: deposit.createdAt,
        userEmail: deposit.user.email
      }))
    });

  } catch (error) {
    console.error('Error checking monitoring status:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check monitoring status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 