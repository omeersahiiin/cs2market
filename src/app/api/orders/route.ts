import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OrderMatchingEngine from '@/lib/orderMatchingEngine';
import { PrismaClientSingleton } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/orders - Get user's orders
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
      'fetch user for orders'
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const skinId = searchParams.get('skinId');
    const status = searchParams.get('status');

    // Handle multiple status values separated by commas
    const statusFilter = status ? status.split(',').map((s: any) => s.trim()) : undefined;

    const orders = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.order.findMany({
          where: {
            userId: user.id,
            ...(skinId && { skinId }),
            ...(statusFilter && { status: { in: statusFilter } })
          },
          include: {
            skin: true,
            fills: true
          },
          orderBy: { createdAt: 'desc' }
        });
      },
      'fetch user orders'
    );

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    
    // Return empty orders array on error instead of 500
    return NextResponse.json({ 
      orders: [],
      error: 'Failed to fetch orders'
    });
  }
}

// POST /api/orders - Place a new order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { skinId, side, orderType, positionType, price, quantity, timeInForce } = body;

    // Validate required fields
    if (!skinId || !side || !orderType || !positionType || !quantity) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'skinId, side, orderType, positionType, and quantity are required'
      }, { status: 400 });
    }

    // Validate order type and price
    if (orderType === 'LIMIT' && (!price || price <= 0)) {
      return NextResponse.json({ 
        error: 'Limit orders require a valid price',
        details: 'Price must be greater than 0 for limit orders'
      }, { status: 400 });
    }

    // Validate quantity
    if (quantity <= 0 || !Number.isFinite(quantity)) {
      return NextResponse.json({ 
        error: 'Quantity must be a positive number',
        details: `Received quantity: ${quantity}`
      }, { status: 400 });
    }

    // Validate side and position type
    if (!['BUY', 'SELL'].includes(side.toUpperCase())) {
      return NextResponse.json({ 
        error: 'Invalid order side',
        details: 'Side must be BUY or SELL'
      }, { status: 400 });
    }

    if (!['LONG', 'SHORT'].includes(positionType.toUpperCase())) {
      return NextResponse.json({ 
        error: 'Invalid position type',
        details: 'Position type must be LONG or SHORT'
      }, { status: 400 });
    }

    // Get user
    const user = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.user.findUnique({
          where: { email: session.user.email }
        });
      },
      'fetch user for order placement'
    );

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found',
        details: 'User account not found in database'
      }, { status: 404 });
    }

    // Check if skin exists
    const skin = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.skin.findUnique({
          where: { id: skinId }
        });
      },
      'fetch skin for order placement'
    );

    if (!skin) {
      return NextResponse.json({ 
        error: 'Skin not found',
        details: 'The specified skin does not exist'
      }, { status: 404 });
    }

    // Check user balance for buy orders
    const orderValue = (price || skin.price) * quantity;
    const marginRequired = orderValue * 0.2; // 20% margin requirement

    if (side === 'BUY' && user.balance < marginRequired) {
      return NextResponse.json({ 
        error: 'Insufficient balance',
        details: `Required margin: $${marginRequired.toFixed(2)}, Available: $${user.balance.toFixed(2)}`
      }, { status: 400 });
    }

    // Initialize order matching engine
    const engine = new OrderMatchingEngine(skinId);

    // Place the order
    const result = await engine.placeOrder({
      userId: user.id,
      side: side.toUpperCase() as 'BUY' | 'SELL',
      orderType: orderType.toUpperCase() as 'MARKET' | 'LIMIT',
      positionType: positionType.toUpperCase() as 'LONG' | 'SHORT',
      price: orderType === 'MARKET' ? skin.price : price,
      quantity,
      timeInForce: timeInForce || 'GTC'
    });

    // Get the created order details
    const createdOrder = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.order.findUnique({
          where: { id: result.orderId },
          include: {
            skin: true,
            fills: true
          }
        });
      },
      'fetch created order details'
    );

    return NextResponse.json({
      order: createdOrder,
      matchResult: result.matchResult
    });

  } catch (error) {
    console.error('Error placing order:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 