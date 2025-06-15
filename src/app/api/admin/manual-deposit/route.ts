import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClientSingleton } from '@/lib/prisma';

const prisma = PrismaClientSingleton.getInstance();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin (you can implement proper admin check)
    if (!session?.user?.email || !session.user.email.includes('admin')) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Admin access required'
      }, { status: 401 });
    }

    const body = await request.json();
    const { 
      userEmail, 
      cryptoType, 
      amount, 
      transactionHash, 
      notes 
    } = body;

    // Validate required fields
    if (!userEmail || !cryptoType || !amount || !transactionHash) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: userEmail, cryptoType, amount, transactionHash'
      }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Convert crypto amount to USD (you can implement real-time rates later)
    const cryptoRates: Record<string, number> = {
      'BTC': 45000,  // Example rates - update with real rates
      'ETH': 2500,
      'USDT': 1,
      'SOL': 100
    };

    const usdAmount = parseFloat(amount) * (cryptoRates[cryptoType] || 1);

    // Create crypto deposit record
    const deposit = await prisma.cryptoDeposit.create({
      data: {
        userId: user.id,
        cryptoType,
        amount: parseFloat(amount),
        usdValue: usdAmount,
        transactionHash,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        notes: notes || `Manual confirmation by admin: ${session.user.email}`
      }
    });

    // Update user balance
    await prisma.user.update({
      where: { id: user.id },
      data: {
        balance: {
          increment: usdAmount
        }
      }
    });

    // Log the transaction
    console.log(`✅ Manual deposit confirmed:`, {
      user: userEmail,
      crypto: `${amount} ${cryptoType}`,
      usd: `$${usdAmount}`,
      txHash: transactionHash,
      admin: session.user.email
    });

    return NextResponse.json({
      success: true,
      message: 'Deposit confirmed successfully',
      deposit: {
        id: deposit.id,
        cryptoType,
        amount: parseFloat(amount),
        usdValue: usdAmount,
        transactionHash,
        confirmedAt: deposit.confirmedAt
      },
      userBalance: user.balance + usdAmount
    });

  } catch (error) {
    console.error('❌ Manual deposit confirmation error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to confirm deposit',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to list pending deposits
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !session.user.email.includes('admin')) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized - Admin access required'
      }, { status: 401 });
    }

    // Get all deposits for admin review
    const deposits = await prisma.cryptoDeposit.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Last 50 deposits
    });

    return NextResponse.json({
      success: true,
      deposits: deposits.map(deposit => ({
        id: deposit.id,
        user: {
          email: deposit.user.email,
          name: deposit.user.name
        },
        cryptoType: deposit.cryptoType,
        amount: deposit.amount,
        usdValue: deposit.usdValue,
        transactionHash: deposit.transactionHash,
        status: deposit.status,
        createdAt: deposit.createdAt,
        confirmedAt: deposit.confirmedAt,
        notes: deposit.notes
      }))
    });

  } catch (error) {
    console.error('❌ Get deposits error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch deposits',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 