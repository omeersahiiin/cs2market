import { PrismaClientSingleton } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const skins = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.skin.findMany({
          orderBy: { updatedAt: 'desc' },
          take: 100,
          select: {
            id: true,
            name: true,
            type: true,
            rarity: true,
            price: true,
            updatedAt: true
          }
        });
      },
      'fetch recent skin price updates'
    );

    return NextResponse.json(skins);
  } catch (error) {
    console.error('Error fetching price updates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price updates' },
      { status: 500 }
    );
  }
} 