import { NextRequest, NextResponse } from 'next/server';
import { PrismaClientSingleton } from '@/lib/prisma';
import { shouldUseMockData } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/debug/database - Test database connectivity and show current orders
export async function GET(request: NextRequest) {
  try {
    console.log('[Debug API] === DATABASE DEBUG START ===');
    console.log(`[Debug API] Timestamp: ${new Date().toISOString()}`);
    console.log(`[Debug API] Environment check:`);
    console.log(`[Debug API] - NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`[Debug API] - VERCEL: ${process.env.VERCEL}`);
    console.log(`[Debug API] - DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
    console.log(`[Debug API] - Should use mock data: ${shouldUseMockData()}`);

    if (shouldUseMockData()) {
      return NextResponse.json({
        status: 'mock_mode',
        message: 'Application is running in mock data mode',
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL: process.env.VERCEL,
          DATABASE_URL_EXISTS: !!process.env.DATABASE_URL
        }
      });
    }

    // Test basic database connectivity
    console.log('[Debug API] Testing database connectivity...');
    const connectionTest = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.$queryRaw`SELECT 1 as test`;
      },
      'database connection test'
    );

    console.log('[Debug API] Database connection successful');

    // Get basic statistics
    console.log('[Debug API] Fetching database statistics...');
    const stats = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        const [userCount, skinCount, orderCount, positionCount] = await Promise.all([
          prisma.user.count(),
          prisma.skin.count(),
          prisma.order.count(),
          prisma.position.count()
        ]);

        return { userCount, skinCount, orderCount, positionCount };
      },
      'database statistics'
    );

    // Get recent orders
    console.log('[Debug API] Fetching recent orders...');
    const recentOrders = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.order.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            skin: { select: { name: true } },
            user: { select: { email: true } }
          }
        });
      },
      'recent orders fetch'
    );

    // Get open orders by status
    console.log('[Debug API] Fetching open orders by status...');
    const ordersByStatus = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        const statusCounts = await prisma.order.groupBy({
          by: ['status'],
          _count: { status: true }
        });

        return statusCounts.reduce((acc: any, item: any) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {});
      },
      'orders by status'
    );

    // Get orders for a specific skin (if provided)
    const { searchParams } = new URL(request.url);
    const skinId = searchParams.get('skinId');
    let skinOrders = null;

    if (skinId) {
      console.log(`[Debug API] Fetching orders for skin: ${skinId}`);
      skinOrders = await PrismaClientSingleton.executeWithRetry(
        async (prisma) => {
          return await prisma.order.findMany({
            where: { skinId },
            orderBy: { createdAt: 'desc' },
            include: {
              skin: { select: { name: true } },
              user: { select: { email: true } }
            }
          });
        },
        'skin orders fetch'
      );
    }

    console.log('[Debug API] === DATABASE DEBUG SUCCESS ===');

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
        SHOULD_USE_MOCK: shouldUseMockData()
      },
      database: {
        connected: true,
        statistics: stats,
        ordersByStatus
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        skinName: order.skin.name,
        userEmail: order.user.email,
        side: order.side,
        orderType: order.orderType,
        status: order.status,
        price: order.price,
        quantity: order.quantity,
        remainingQty: order.remainingQty,
        createdAt: order.createdAt
      })),
      ...(skinOrders && {
        skinOrders: skinOrders.map(order => ({
          id: order.id,
          skinName: order.skin.name,
          userEmail: order.user.email,
          side: order.side,
          orderType: order.orderType,
          status: order.status,
          price: order.price,
          quantity: order.quantity,
          remainingQty: order.remainingQty,
          createdAt: order.createdAt
        }))
      })
    });

  } catch (error) {
    console.error('[Debug API] === DATABASE DEBUG FAILED ===');
    console.error('[Debug API] Error:', error);
    console.error('[Debug API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
        SHOULD_USE_MOCK: shouldUseMockData()
      },
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
} 