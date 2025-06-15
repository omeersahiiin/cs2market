import { NextResponse } from 'next/server';
import { PrismaClientSingleton } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('🚀 Deploying crypto deposit schema...');

    // Try to create the tables by running a simple query
    // This will fail if tables don't exist, which is expected
    let supportedCryptoExists = false;
    let cryptoDepositExists = false;

    try {
      await PrismaClientSingleton.executeWithRetry(
        async (prisma) => {
          await prisma.supportedCrypto.findFirst();
          return true;
        },
        'check supported crypto table'
      );
      supportedCryptoExists = true;
    } catch (error) {
      console.log('SupportedCrypto table needs to be created');
    }

    try {
      await PrismaClientSingleton.executeWithRetry(
        async (prisma) => {
          await prisma.cryptoDeposit.findFirst();
          return true;
        },
        'check crypto deposit table'
      );
      cryptoDepositExists = true;
    } catch (error) {
      console.log('CryptoDeposit table needs to be created');
    }

    if (supportedCryptoExists && cryptoDepositExists) {
      return NextResponse.json({
        message: 'Schema already deployed',
        status: 'success',
        tables: {
          supportedCrypto: 'exists',
          cryptoDeposit: 'exists'
        }
      });
    }

    // Initialize supported cryptocurrencies if table exists
    if (supportedCryptoExists) {
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

      await PrismaClientSingleton.executeWithRetry(
        async (prisma) => {
          for (const crypto of supportedCryptos) {
            await prisma.supportedCrypto.upsert({
              where: { symbol: crypto.symbol },
              update: { ...crypto, isActive: true },
              create: { ...crypto, isActive: true }
            });
          }
        },
        'initialize supported cryptocurrencies'
      );
    }

    return NextResponse.json({
      message: 'Schema deployment attempted',
      status: 'partial',
      note: 'Some tables may need manual migration with: npx prisma db push',
      tables: {
        supportedCrypto: supportedCryptoExists ? 'exists' : 'needs_migration',
        cryptoDeposit: cryptoDepositExists ? 'exists' : 'needs_migration'
      }
    });

  } catch (error) {
    console.error('Error deploying crypto schema:', error);
    return NextResponse.json({
      error: 'Failed to deploy schema',
      details: error instanceof Error ? error.message : 'Unknown error',
      solution: 'Run: npx prisma db push'
    }, { status: 500 });
  }
} 