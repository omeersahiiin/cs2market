import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OrderMatchingEngine from '@/lib/orderMatchingEngine';
import { shouldUseMockData, MOCK_SKINS, addMockOrder, addMockTrade } from '@/lib/mock-data';

// Conditional Prisma imports for when database is available
let prisma: any = null;
let Prisma: any = null;

try {
  const { PrismaClient, Prisma: PrismaTypes } = require('@prisma/client');
  prisma = new PrismaClient();
  Prisma = PrismaTypes;
} catch (error) {
  console.log('Prisma not available, using mock mode');
}

export const dynamic = 'force-dynamic';

// Mock orders data - this will be populated dynamically
let MOCK_ORDERS: any[] = [];

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
      console.log('Creating mock order:', { skinId, side, orderType, positionType, price, quantity });
      
      // Find the skin
      const skin = MOCK_SKINS.find(s => s.id === skinId);
      if (!skin) {
        return NextResponse.json({ error: 'Skin not found' }, { status: 404 });
      }

      // Determine execution price for market orders
      let executionPrice = price;
      if (orderType === 'MARKET') {
        // For market orders, use current market price with slight slippage
        executionPrice = skin.price * (side === 'BUY' ? 1.001 : 0.999); // 0.1% slippage
      }

      // Create mock order
      const newOrder = {
        id: `order-${Date.now()}`,
        userId: session.user.id,
        skinId,
        side,
        orderType,
        positionType,
        price: executionPrice,
        quantity,
        remainingQty: orderType === 'MARKET' ? 0 : quantity, // Market orders fill immediately
        status: orderType === 'MARKET' ? 'FILLED' : 'OPEN',
        timeInForce: timeInForce || 'GTC',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        skin,
        fills: orderType === 'MARKET' ? [{
          id: `fill-${Date.now()}`,
          orderId: `order-${Date.now()}`,
          price: executionPrice,
          quantity: quantity,
          createdAt: new Date().toISOString()
        }] : []
      };

      // Add to mock orders
      MOCK_ORDERS.push(newOrder);
      
      // Add to mock order book system
      addMockOrder(newOrder);

      // If market order, create a trade and position
      if (orderType === 'MARKET') {
        addMockTrade(skinId, executionPrice, quantity, side.toLowerCase() as 'buy' | 'sell');
        
        // Create position for market orders (they execute immediately)
        const { addMockPosition } = await import('@/lib/mock-data');
        const newPosition = {
          id: `pos-${Date.now()}`,
          userId: session.user.id,
          skinId,
          type: positionType,
          entryPrice: executionPrice,
          size: quantity,
          margin: executionPrice * quantity * 0.2, // 20% margin
          createdAt: new Date().toISOString(),
          closedAt: null,
          exitPrice: null,
          skin
        };
        
        addMockPosition(newPosition);
        console.log('Created mock position:', newPosition.id);
      }

      console.log('Mock order created successfully:', newOrder.id);

      return NextResponse.json({
        order: newOrder,
        matchResult: {
          fills: newOrder.fills,
          remainingQuantity: newOrder.remainingQty,
          status: newOrder.status
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
      await prisma.$transaction(async (tx: any) => {
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