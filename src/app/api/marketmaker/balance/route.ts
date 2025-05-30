import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// GET /api/marketmaker/balance - Get market maker's current balance
export async function GET() {
  try {
    const marketMaker = await prisma.user.findUnique({
      where: { email: 'marketmaker@cs2derivatives.com' },
      select: {
        id: true,
        username: true,
        email: true,
        balance: true,
        createdAt: true
      }
    });

    if (!marketMaker) {
      return NextResponse.json({ error: 'Market maker account not found' }, { status: 404 });
    }

    return NextResponse.json({
      marketMaker,
      message: 'Market maker balance retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching market maker balance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 