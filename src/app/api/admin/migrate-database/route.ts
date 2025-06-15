import { NextResponse } from 'next/server';
import { PrismaClientSingleton } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('🚀 Starting database migration for crypto deposit tables...');

    // Test if the tables already exist
    let tablesExist = false;
    
    try {
      await PrismaClientSingleton.executeWithRetry(
        async (prisma) => {
          // Try to query both tables - this will work if they exist
          const cryptoCount = await prisma.cryptoDeposit.count();
          const supportedCount = await prisma.supportedCrypto.count();
          console.log(`Found ${cryptoCount} crypto deposits and ${supportedCount} supported cryptos`);
          return true;
        },
        'check existing crypto tables'
      );
      tablesExist = true;
    } catch (error) {
      console.log('Crypto tables do not exist yet - this is expected for first migration');
    }

    if (tablesExist) {
      // Tables exist, just initialize supported cryptocurrencies
      console.log('✅ Tables already exist, initializing supported cryptocurrencies...');
      
      const supportedCryptos = [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          network: 'Bitcoin',
          decimals: 8,
          minDeposit: 0.001,
          requiredConfirmations: 3,
          depositFee: 0,
          iconUrl: '/crypto/btc.png'
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          network: 'Ethereum',
          decimals: 18,
          minDeposit: 0.01,
          requiredConfirmations: 12,
          depositFee: 0,
          iconUrl: '/crypto/eth.png'
        },
        {
          symbol: 'USDT',
          name: 'Tether (TRC20)',
          network: 'Tron',
          contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
          decimals: 6,
          minDeposit: 10,
          requiredConfirmations: 20,
          depositFee: 0,
          iconUrl: '/crypto/usdt.png'
        },
        {
          symbol: 'SOL',
          name: 'Solana',
          network: 'Solana',
          decimals: 9,
          minDeposit: 0.1,
          requiredConfirmations: 1,
          depositFee: 0,
          iconUrl: '/crypto/sol.png'
        }
      ];

      let initialized = 0;
      await PrismaClientSingleton.executeWithRetry(
        async (prisma) => {
          for (const crypto of supportedCryptos) {
            const result = await prisma.supportedCrypto.upsert({
              where: { symbol: crypto.symbol },
              update: { ...crypto, isActive: true },
              create: { ...crypto, isActive: true }
            });
            initialized++;
            console.log(`✅ Initialized ${crypto.symbol} - ${crypto.name}`);
          }
        },
        'initialize supported cryptocurrencies'
      );

      return NextResponse.json({
        success: true,
        message: 'Database migration completed successfully',
        status: 'tables_exist',
        details: {
          cryptoDeposits: 'table exists',
          supportedCryptos: 'table exists',
          initialized: initialized
        },
        next_steps: [
          'Crypto deposit system is now fully functional',
          'Visit /deposit to test the deposit page',
          'Set up Binance API for automatic monitoring'
        ]
      });
    }

    // If we get here, tables don't exist
    return NextResponse.json({
      success: false,
      message: 'Database tables do not exist yet',
      status: 'migration_needed',
      error: 'The crypto_deposits and supported_cryptos tables need to be created',
      solution: 'The Prisma schema is ready, but the tables need to be created in the database',
      manual_steps: [
        '1. The schema is already defined in prisma/schema.prisma',
        '2. Tables should be created automatically on next deployment',
        '3. If not, contact your database administrator'
      ]
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Database migration failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Database migration failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'This might be because the tables do not exist yet',
      solution: 'The Prisma schema includes the crypto deposit tables, they should be created on deployment'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Database Migration Endpoint',
    description: 'This endpoint checks and initializes crypto deposit tables',
    usage: 'POST to this endpoint to run the migration',
    tables: [
      'crypto_deposits - tracks user crypto deposits',
      'supported_cryptos - manages supported cryptocurrencies'
    ],
    status: 'ready'
  });
} 