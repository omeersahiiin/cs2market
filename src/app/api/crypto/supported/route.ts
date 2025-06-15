import { NextResponse } from 'next/server';
import { PrismaClientSingleton } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supportedCryptos = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.supportedCrypto.findMany({
          where: { isActive: true },
          orderBy: { symbol: 'asc' }
        });
      },
      'fetch supported cryptocurrencies'
    );

    return NextResponse.json({ cryptos: supportedCryptos });

  } catch (error) {
    console.error('Error fetching supported cryptos:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Admin endpoint to add/update supported cryptocurrencies
export async function POST(request: Request) {
  try {
    const cryptoData = await request.json();
    
    const {
      symbol,
      name,
      network,
      contractAddress,
      decimals = 18,
      minDeposit,
      requiredConfirmations = 1,
      depositFee = 0,
      iconUrl
    } = cryptoData;

    if (!symbol || !name || !network || !minDeposit) {
      return NextResponse.json({ 
        error: 'Missing required fields: symbol, name, network, minDeposit' 
      }, { status: 400 });
    }

    const crypto = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.supportedCrypto.upsert({
          where: { symbol },
          update: {
            name,
            network,
            contractAddress,
            decimals,
            minDeposit,
            requiredConfirmations,
            depositFee,
            iconUrl,
            isActive: true
          },
          create: {
            symbol,
            name,
            network,
            contractAddress,
            decimals,
            minDeposit,
            requiredConfirmations,
            depositFee,
            iconUrl,
            isActive: true
          }
        });
      },
      'create/update supported crypto'
    );

    return NextResponse.json({ crypto }, { status: 201 });

  } catch (error) {
    console.error('Error creating/updating crypto:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 