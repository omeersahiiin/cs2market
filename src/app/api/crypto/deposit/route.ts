import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClientSingleton } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Generate a deposit address using your real wallet addresses
function generateDepositAddress(cryptocurrency: string, network: string): string {
  // Real wallet addresses for deposits
  switch (cryptocurrency.toUpperCase()) {
    case 'BTC':
      return '1365feiMB5himtGcrhtPjH6tCzCfS7QJCG';
    case 'ETH':
      return '0x49cd0a247b5f8cb03df506473a7a60fe3ea56bba';
    case 'USDT':
      if (network === 'Tron') {
        return 'TC49w5CVFdbsdxvoCSiWY4ANtCxFBbbC1Y';
      } else {
        return '0x49cd0a247b5f8cb03df506473a7a60fe3ea56bba'; // ETH network
      }
    case 'SOL':
      return 'HE7xDMhz4qHEvJL1vaT9eHpHDaGYAWQvqwniMTjBFLuU';
    case 'TRX':
      return 'TC49w5CVFdbsdxvoCSiWY4ANtCxFBbbC1Y';
    default:
      throw new Error(`Unsupported cryptocurrency: ${cryptocurrency}`);
  }
}

// Create a new deposit request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cryptocurrency, network } = await request.json();

    if (!cryptocurrency || !network) {
      return NextResponse.json({ 
        error: 'Missing required fields: cryptocurrency, network' 
      }, { status: 400 });
    }

    const user = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.user.findUnique({
          where: { email: session.user.email }
        });
      },
      'fetch user for deposit'
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate deposit address
    const depositAddress = generateDepositAddress(cryptocurrency, network);
    
    // Set expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create deposit record
    const deposit = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.cryptoDeposit.create({
          data: {
            userId: user.id,
            cryptocurrency: cryptocurrency.toUpperCase(),
            network,
            depositAddress,
            status: 'PENDING',
            expiresAt,
            requiredConfirmations: getRequiredConfirmations(cryptocurrency)
          }
        });
      },
      'create crypto deposit'
    );

    return NextResponse.json({
      depositId: deposit.id,
      depositAddress: deposit.depositAddress,
      cryptocurrency: deposit.cryptocurrency,
      network: deposit.network,
      expiresAt: deposit.expiresAt,
      requiredConfirmations: deposit.requiredConfirmations,
      status: deposit.status
    });

  } catch (error) {
    console.error('Error creating crypto deposit:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get user's deposit history
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
      'fetch user for deposit history'
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const deposits = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.cryptoDeposit.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 50
        });
      },
      'fetch user deposits'
    );

    return NextResponse.json({ deposits });

  } catch (error) {
    console.error('Error fetching deposits:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getRequiredConfirmations(cryptocurrency: string): number {
  switch (cryptocurrency.toUpperCase()) {
    case 'BTC':
      return 3;
    case 'ETH':
      return 12;
    case 'USDT':
      return 20; // Tron-based USDT (TRC20)
    case 'SOL':
      return 1;
    default:
      return 1;
  }
} 