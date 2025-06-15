import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClientSingleton } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Generate a deposit address (placeholder - you'll integrate with actual wallet service)
function generateDepositAddress(cryptocurrency: string, network: string): string {
  // This is a placeholder - replace with actual wallet service integration
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  
  switch (cryptocurrency.toUpperCase()) {
    case 'BTC':
      return `bc1q${random}${timestamp.toString().slice(-6)}`;
    case 'ETH':
    case 'USDT':
      return `0x${random}${timestamp.toString(16)}`.substring(0, 42);
    case 'TRX':
      return `T${random}${timestamp.toString().slice(-6)}`.substring(0, 34);
    default:
      return `${cryptocurrency.toLowerCase()}_${random}_${timestamp}`;
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
      return 12; // Ethereum-based USDT
    case 'TRX':
      return 20;
    default:
      return 1;
  }
} 