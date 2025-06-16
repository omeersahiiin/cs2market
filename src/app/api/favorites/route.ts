import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Get user's favorites
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        favorites: {
          include: {
            skin: true
          }
        }
      }
    });

    return NextResponse.json({ favorites: user?.favorites || [] });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Add to favorites
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { skinId } = await req.json();

    if (!skinId) {
      return NextResponse.json({ error: 'Skin ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: user.id,
        skinId
      }
    });

    return NextResponse.json(favorite);
  } catch (error) {
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: 'Already favorited' }, { status: 400 });
    }
    console.error('Error adding favorite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Remove from favorites
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { skinId } = await req.json();

    if (!skinId) {
      return NextResponse.json({ error: 'Skin ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.favorite.delete({
      where: {
        userId_skinId: {
          userId: user.id,
          skinId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }
    console.error('Error removing favorite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 