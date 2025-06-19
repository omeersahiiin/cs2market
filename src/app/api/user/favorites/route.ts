import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClientSingleton } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/user/favorites - Get user's favorite skins
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
      'fetch user for favorites'
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const favorites = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.favoriteSkin.findMany({
          where: { userId: user.id },
          include: {
            skin: true
          },
          orderBy: { createdAt: 'desc' }
        });
      },
      'fetch user favorites'
    );

    // Return both the favorites and just the skin IDs for easy checking
    const favoriteSkinIds = favorites.map((fav: any) => fav.skinId);
    
    return NextResponse.json({ 
      favorites: favorites.map((fav: any) => fav.skin),
      favoriteIds: favoriteSkinIds
    });

  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/user/favorites - Add or remove a favorite skin
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { skinId, action } = await request.json();
    
    if (!skinId || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: skinId and action (add/remove)' 
      }, { status: 400 });
    }

    if (!['add', 'remove'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be "add" or "remove"' 
      }, { status: 400 });
    }

    const user = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.user.findUnique({
          where: { email: session.user.email }
        });
      },
      'fetch user for favorites action'
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify skin exists
    const skin = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.skin.findUnique({
          where: { id: skinId }
        });
      },
      'verify skin exists'
    );

    if (!skin) {
      return NextResponse.json({ error: 'Skin not found' }, { status: 404 });
    }

    let result;

    if (action === 'add') {
      // Add to favorites (upsert to handle duplicates gracefully)
      result = await PrismaClientSingleton.executeWithRetry(
        async (prisma) => {
          return await prisma.favoriteSkin.upsert({
            where: {
              userId_skinId: {
                userId: user.id,
                skinId: skinId
              }
            },
            update: {}, // No update needed, just return existing
            create: {
              userId: user.id,
              skinId: skinId
            },
            include: {
              skin: true
            }
          });
        },
        'add favorite skin'
      );

      return NextResponse.json({ 
        message: 'Skin added to favorites',
        favorite: result.skin,
        action: 'added'
      });

    } else { // action === 'remove'
      // Remove from favorites
      const deleted = await PrismaClientSingleton.executeWithRetry(
        async (prisma) => {
          return await prisma.favoriteSkin.deleteMany({
            where: {
              userId: user.id,
              skinId: skinId
            }
          });
        },
        'remove favorite skin'
      );

      if (deleted.count === 0) {
        return NextResponse.json({ 
          message: 'Skin was not in favorites',
          action: 'not_found'
        });
      }

      return NextResponse.json({ 
        message: 'Skin removed from favorites',
        action: 'removed'
      });
    }

  } catch (error) {
    console.error('Error managing favorites:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/user/favorites - Clear all favorites (optional convenience endpoint)
export async function DELETE(request: NextRequest) {
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
      'fetch user for clear favorites'
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const deleted = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.favoriteSkin.deleteMany({
          where: { userId: user.id }
        });
      },
      'clear all favorites'
    );

    return NextResponse.json({ 
      message: `Cleared ${deleted.count} favorites`,
      count: deleted.count
    });

  } catch (error) {
    console.error('Error clearing favorites:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 