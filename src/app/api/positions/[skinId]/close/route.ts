import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { skinId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find the open position
  const position = await prisma.position.findFirst({
    where: {
      skinId: params.skinId,
      userId: session.user.id,
      closedAt: null,
    },
    include: { skin: true },
  });

  if (!position) {
    return NextResponse.json({ error: 'Position not found' }, { status: 404 });
  }

  // Calculate P&L
  const currentPrice = position.skin.price;
  let pnl = 0;
  if (position.type === 'LONG') {
    pnl = (currentPrice - position.entryPrice) * position.size;
  } else {
    pnl = (position.entryPrice - currentPrice) * position.size;
  }

  // Update position and user balance in a transaction
  await prisma.$transaction([
    prisma.position.update({
      where: { id: position.id },
      data: {
        closedAt: new Date() as Date,
        exitPrice: currentPrice, // Store the exit price
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        balance: {
          increment: position.margin + pnl,
        },
      },
    }),
  ]);

  return NextResponse.json({ success: true, pnl });
} 