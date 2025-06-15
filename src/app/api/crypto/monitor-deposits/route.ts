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

    // Check if Binance API credentials are configured
    if (!process.env.BINANCE_API_KEY || !process.env.BINANCE_SECRET_KEY) {
      return NextResponse.json({
        error: 'Binance API credentials not configured',
        message: 'Please set BINANCE_API_KEY and BINANCE_SECRET_KEY environment variables',
        status: 'configuration_required'
      }, { status: 400 });
    }

    // Validate Binance API credentials
    const isValidCredentials = await binanceAPI.validateCredentials();
    if (!isValidCredentials) {
      return NextResponse.json({
        error: 'Invalid Binance API credentials',
        message: 'Please check your BINANCE_API_KEY and BINANCE_SECRET_KEY environment variables',
        status: 'invalid_credentials'
      }, { status: 400 });
    }

    // Check if crypto deposit tables exist
    let tablesExist = false;
    try {
      await PrismaClientSingleton.executeWithRetry(
        async (prisma) => {
          // Try a simple query to check if tables exist
          await (prisma as any).cryptoDeposit.findFirst();
          return true;
        },
        'check crypto deposit table'
      );
      tablesExist = true;
    } catch (error) {
      console.log('Crypto deposit tables do not exist yet');
    }

    if (!tablesExist) {
      return NextResponse.json({
        error: 'Database tables not ready',
        message: 'Crypto deposit tables need to be created first',
        solution: 'Run database migration: POST /api/admin/migrate-database',
        status: 'migration_required'
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
            return await (prisma as any).cryptoDeposit.findFirst({
              where: {
                status: 'PENDING',
                cryptocurrency: deposit.coin,
                // Match by address or transaction hash
                OR: [
                  { depositAddress: deposit.address },
                  { txHash: deposit.txId }
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
            await (prisma as any).cryptoDeposit.update({
              where: { id: pendingDeposit.id },
              data: {
                status: 'CONFIRMED',
                amount: cryptoAmount,
                usdValue: usdValue,
                txHash: deposit.txId,
                confirmations: parseInt(deposit.confirmTimes) || 0,
                creditedAt: new Date(deposit.insertTime)
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
      success: true,
      message: `Processed ${processedDeposits} deposits`,
      totalFound: newDeposits.length,
      processed: processedDeposits,
      results: results,
      status: 'monitoring_active'
    });

  } catch (error) {
    console.error('Error monitoring deposits:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to monitor deposits',
      details: error instanceof Error ? error.message : 'Unknown error',
      status: 'monitoring_failed'
    }, { status: 500 });
  }
}

// GET endpoint to check monitoring status
export async function GET() {
  try {
    // Check Binance API status
    const binanceConfigured = !!(process.env.BINANCE_API_KEY && process.env.BINANCE_SECRET_KEY);
    let binanceValid = false;
    
    if (binanceConfigured) {
      try {
        binanceValid = await binanceAPI.validateCredentials();
      } catch (error) {
        console.error('Binance API validation failed:', error);
      }
    }

    // Check database tables
    let tablesExist = false;
    let recentDepositsCount = 0;
    
    try {
      const recentDeposits = await PrismaClientSingleton.executeWithRetry(
        async (prisma) => {
          return await (prisma as any).cryptoDeposit.findMany({
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
      
      tablesExist = true;
      recentDepositsCount = recentDeposits.length;
    } catch (error) {
      console.log('Crypto deposit tables not available');
    }

    return NextResponse.json({
      status: tablesExist && binanceValid ? 'active' : 'inactive',
      message: 'Deposit monitoring status',
      configuration: {
        binanceApiConfigured: binanceConfigured,
        binanceApiValid: binanceValid,
        databaseTablesExist: tablesExist
      },
      recentDeposits: recentDepositsCount,
      requirements: {
        binanceApi: binanceConfigured && binanceValid ? '✅ Ready' : '❌ Not configured',
        database: tablesExist ? '✅ Ready' : '❌ Migration required'
      }
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