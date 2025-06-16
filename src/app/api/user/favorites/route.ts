import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClientSingleton } from '@/lib/prisma';

const prisma = PrismaClientSingleton.getInstance();

export const dynamic = 'force-dynamic';

// Get user's favorite skins
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const favorites = await prisma.favoriteSkin.findMany({
      where: { userId: user.id },
      include: {
        skin: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

// Add or remove a skin from favorites
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { skinId, action } = await request.json();

    if (!skinId || !['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'add') {
      // Add to favorites
      await prisma.favoriteSkin.create({
        data: {
          userId: user.id,
          skinId
        }
      });
      return NextResponse.json({ message: 'Added to favorites' });
    } else {
      // Remove from favorites
      await prisma.favoriteSkin.delete({
        where: {
          userId_skinId: {
            userId: user.id,
            skinId
          }
        }
      });
      return NextResponse.json({ message: 'Removed from favorites' });
    }
  } catch (error) {
    console.error('Error managing favorites:', error);
    return NextResponse.json(
      { error: 'Failed to manage favorites' },
      { status: 500 }
    );
  }
} 