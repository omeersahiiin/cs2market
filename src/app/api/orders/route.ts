import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, Prisma } from '@prisma/client';
import OrderMatchingEngine from '@/lib/orderMatchingEngine';
import { shouldUseMockData, MOCK_SKINS } from '@/lib/mock-data';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// Mock orders data
const MOCK_ORDERS = [
  {
    id: 'order-1',
    userId: 'mock-user-1',
    skinId: 'skin-1',
    side: 'BUY',
    orderType: 'LIMIT',
    positionType: 'LONG',
    price: 7400.00,
    quantity: 1,
    remainingQty: 0.5,
    status: 'PARTIALLY_FILLED',
    timeInForce: 'GTC',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // Updated 15 minutes ago
    skin: MOCK_SKINS[0], // AWP Dragon Lore
    fills: [
      {
        id: 'fill-1',
        orderId: 'order-1',
        price: 7400.00,
        quantity: 0.5,
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: 'order-2',
    userId: 'mock-user-1',
    skinId: 'skin-2',
    side: 'SELL',
    orderType: 'LIMIT',
    positionType: 'SHORT',
    price: 1300.00,
    quantity: 3,
    remainingQty: 3,
    status: 'OPEN',
    timeInForce: 'GTC',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    skin: MOCK_SKINS[1], // AK-47 Fire Serpent
    fills: []
  },
  {
    id: 'order-3',
    userId: 'mock-user-1',
    skinId: 'skin-3',
    side: 'BUY',
    orderType: 'MARKET',
    positionType: 'LONG',
    price: null,
    quantity: 5,
    remainingQty: 0,
    status: 'FILLED',
    timeInForce: 'IOC',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    skin: MOCK_SKINS[2], // AWP Asiimov
    fills: [
      {
        id: 'fill-2',
        orderId: 'order-3',
        price: 151.25,
        quantity: 5,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
];

// GET /api/orders - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if we should use mock data
    if (shouldUseMockData()) {
      console.log('Using mock orders data');
      
      const { searchParams } = new URL(request.url);
      const skinId = searchParams.get('skinId');
      const status = searchParams.get('status');
      
      // Handle multiple status values separated by commas
      const statusFilter = status ? status.split(',').map((s: any) => s.trim()) : undefined;
      
      // Filter mock orders
      let filteredOrders = MOCK_ORDERS.filter(order => order.userId === session.user.id);
      
      if (skinId) {
        filteredOrders = filteredOrders.filter(order => order.skinId === skinId);
      }
      
      if (statusFilter) {
        filteredOrders = filteredOrders.filter(order => statusFilter.includes(order.status));
      }
      
      return NextResponse.json({ orders: filteredOrders });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const skinId = searchParams.get('skinId');
    const status = searchParams.get('status');

    // Handle multiple status values separated by commas
    const statusFilter = status ? status.split(',').map((s: any) => s.trim()) : undefined;

    const orders = await prisma.order.findMany({
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

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/orders - Place a new order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { skinId, side, orderType, positionType, price, quantity, timeInForce } = body;

    // Validate required fields
    if (!skinId || !side || !orderType || !positionType || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate order type and price
    if (orderType === 'LIMIT' && (!price || price <= 0)) {
      return NextResponse.json({ error: 'Limit orders require a valid price' }, { status: 400 });
    }

    // Validate quantity
    if (quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be positive' }, { status: 400 });
    }

    // Check if we should use mock data
    if (shouldUseMockData()) {
      console.log('Creating mock order');
      
      // Find the skin
      const skin = MOCK_SKINS.find(s => s.id === skinId);
      if (!skin) {
        return NextResponse.json({ error: 'Skin not found' }, { status: 404 });
      }

      // Create mock order
      const newOrder = {
        id: `order-${Date.now()}`,
        userId: session.user.id,
        skinId,
        side,
        orderType,
        positionType,
        price: orderType === 'LIMIT' ? price : null,
        quantity,
        remainingQty: quantity,
        status: 'OPEN',
        timeInForce: timeInForce || 'GTC',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        skin,
        fills: []
      };

      // Add to mock orders (in a real app, this would be stored)
      MOCK_ORDERS.push(newOrder);

      return NextResponse.json({
        order: newOrder,
        matchResult: {
          fills: [],
          remainingQuantity: quantity,
          status: 'OPEN'
        }
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if skin exists
    const skin = await prisma.skin.findUnique({
      where: { id: skinId }
    });

    if (!skin) {
      return NextResponse.json({ error: 'Skin not found' }, { status: 404 });
    }

    // Calculate required margin (20% of position value)
    const estimatedPrice = price || skin.price;
    const positionValue = estimatedPrice * quantity;
    const requiredMargin = positionValue * 0.2; // 20% margin requirement

    // Check if user has sufficient balance
    if (user.balance < requiredMargin) {
      return NextResponse.json({ 
        error: 'Insufficient balance for margin requirement',
        required: requiredMargin,
        available: user.balance
      }, { status: 400 });
    }

    // Initialize order matching engine
    const engine = new OrderMatchingEngine(skinId);

    // Place the order
    const result = await engine.placeOrder({
      userId: user.id,
      side: side as 'BUY' | 'SELL',
      orderType: orderType as 'MARKET' | 'LIMIT',
      positionType: positionType as 'LONG' | 'SHORT',
      price: orderType === 'LIMIT' ? price : undefined,
      quantity,
      timeInForce
    });

    // If order was filled (fully or partially), create positions and update balance
    if (result.matchResult.fills.length > 0) {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Calculate total filled quantity and average fill price
        const userFills = result.matchResult.fills.filter(
          fill => fill.buyUserId === user.id || fill.sellUserId === user.id
        );
        
        const totalFilledQty = userFills.reduce((sum, fill) => sum + fill.quantity, 0);
        const avgFillPrice = userFills.reduce((sum, fill) => sum + (fill.price * fill.quantity), 0) / totalFilledQty;
        
        if (totalFilledQty > 0) {
          // Calculate commission (0.02% of trade value)
          const tradeValue = avgFillPrice * totalFilledQty;
          const commission = tradeValue * 0.0002; // 0.02%
          
          // Create position for filled quantity
          await tx.position.create({
            data: {
              userId: user.id,
              skinId,
              type: positionType,
              entryPrice: avgFillPrice,
              size: totalFilledQty,
              margin: avgFillPrice * totalFilledQty * 0.2
            }
          });

          // Deduct margin + commission from user balance
          const marginUsed = avgFillPrice * totalFilledQty * 0.2;
          const totalDeduction = marginUsed + commission;
          
          await tx.user.update({
            where: { id: user.id },
            data: {
              balance: {
                decrement: totalDeduction
              }
            }
          });

          // Transfer commission to market maker account
          const marketMaker = await tx.user.findUnique({
            where: { email: 'marketmaker@cs2derivatives.com' }
          });
          
          if (marketMaker) {
            await tx.user.update({
              where: { id: marketMaker.id },
              data: {
                balance: {
                  increment: commission
                }
              }
            });
          }
        }
      });
    }

    // Get updated order details
    const updatedOrder = await prisma.order.findUnique({
      where: { id: result.orderId },
      include: {
        skin: true,
        fills: true
      }
    });

    return NextResponse.json({
      order: updatedOrder,
      matchResult: result.matchResult
    });

  } catch (error) {
    console.error('Error placing order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 