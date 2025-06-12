import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// Conditional Prisma imports for when database is available
let PrismaClient: any = null;
let Prisma: any = null;

try {
  const prismaModule = require('@prisma/client');
  PrismaClient = prismaModule.PrismaClient;
  Prisma = prismaModule.Prisma;
} catch (error) {
  console.log('Prisma not available, using mock mode');
}
import OrderMatchingEngine from '@/lib/orderMatchingEngine';
import { shouldUseMockData, getMockOrderBook } from '@/lib/mock-data';

const prisma = PrismaClient ? new PrismaClient() : null;

export const dynamic = 'force-dynamic';

// Execute market close by taking liquidity from the order book
async function executeMarketClose(engine: OrderMatchingEngine, userId: string, side: string, quantity: number) {
  // Get the order book to find available liquidity
  const orderBook = await engine.getOrderBook();
  
  // Get the opposite side orders (if we're selling, we need buy orders)
  const availableOrders = side === 'SELL' ? orderBook.bids : orderBook.asks;
  
  if (!availableOrders.length) {
    return { orderId: null, matchResult: { fills: [], updatedOrders: [] } };
  }
  
  const fills: any[] = [];
  const updatedOrders: any[] = [];
  let remainingQty = quantity;
  
  // Execute against available orders until we're filled or run out of liquidity
  for (const bookOrder of availableOrders) {
    if (remainingQty <= 0) break;
    
    // Don't match against our own orders
    if (bookOrder.userId === userId) continue;
    
    const fillQty = Math.min(remainingQty, bookOrder.remainingQty);
    const fillPrice = bookOrder.price;
    
    fills.push({
      buyOrderId: side === 'BUY' ? 'market-close' : bookOrder.id,
      sellOrderId: side === 'SELL' ? 'market-close' : bookOrder.id,
      price: fillPrice,
      quantity: fillQty,
      buyUserId: side === 'BUY' ? userId : bookOrder.userId,
      sellUserId: side === 'SELL' ? userId : bookOrder.userId
    });
    
    remainingQty -= fillQty;
    const newBookOrderRemainingQty = bookOrder.remainingQty - fillQty;
    
    updatedOrders.push({
      orderId: bookOrder.id,
      newRemainingQty: newBookOrderRemainingQty,
      status: newBookOrderRemainingQty === 0 ? 'FILLED' : 'PARTIAL'
    });
  }
  
  return { orderId: 'market-close', matchResult: { fills, updatedOrders } };
}

// POST /api/positions/[skinId]/close-order - Close position via order book
export async function POST(
  request: NextRequest,
  { params }: { params: { skinId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if we should use mock data
    if (shouldUseMockData()) {
      console.log('Using mock data for position closing');
      
      const { skinId } = params;
      const body = await request.json();
      const { orderType = 'MARKET', price } = body;

      // Get mock order book
      const mockOrderBook = getMockOrderBook(skinId);
      
      // Find mock position
      const mockPosition = {
        id: 'pos-1',
        userId: session.user.id,
        skinId,
        type: 'LONG',
        entryPrice: mockOrderBook.bids[0]?.price || 1000,
        size: 2,
        margin: 500,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        closedAt: null,
        exitPrice: null
      };

      if (!mockPosition) {
        return NextResponse.json({ error: 'No open position found for this skin' }, { status: 404 });
      }

      // For market orders, use current market price
      const exitPrice = orderType === 'MARKET' 
        ? ((mockOrderBook.asks[0]?.price || 1000) + (mockOrderBook.bids[0]?.price || 1000)) / 2
        : price;

      // Calculate PnL
      const pnl = mockPosition.type === 'LONG'
        ? (exitPrice - mockPosition.entryPrice) * mockPosition.size
        : (mockPosition.entryPrice - exitPrice) * mockPosition.size;

      // Return mock close result
      return NextResponse.json({
        success: true,
        position: {
          ...mockPosition,
          closedAt: new Date(),
          exitPrice,
          pnl
        },
        order: {
          id: `order-${Date.now()}`,
          userId: session.user.id,
          skinId,
          side: mockPosition.type === 'LONG' ? 'SELL' : 'BUY',
          orderType,
          price: exitPrice,
          quantity: mockPosition.size,
          status: 'FILLED',
          createdAt: new Date(),
          fills: [{
            price: exitPrice,
            quantity: mockPosition.size,
            timestamp: new Date()
          }]
        }
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { skinId } = params;
    const body = await request.json();
    const { orderType = 'MARKET', price } = body;

    // Find the user's position for this skin
    const position = await prisma.position.findFirst({
      where: {
        userId: user.id,
        skinId: skinId,
        closedAt: null // Only open positions
      },
      include: {
        skin: true
      }
    });

    if (!position) {
      return NextResponse.json({ error: 'No open position found for this skin' }, { status: 404 });
    }

    // Determine the opposite side for closing
    const closingSide = position.type === 'LONG' ? 'SELL' : 'BUY';
    const closingPositionType = position.type === 'LONG' ? 'SHORT' : 'LONG';

    // Initialize order matching engine
    const engine = new OrderMatchingEngine(skinId);

    let result;
    
    if (orderType === 'MARKET') {
      result = await executeMarketClose(engine, user.id, closingSide, position.size);
      
      if (!result.matchResult.fills.length) {
        return NextResponse.json({ error: 'No liquidity available for market close' }, { status: 400 });
      }
    } else {
      if (!price || price <= 0) {
        return NextResponse.json({ error: 'Invalid limit price' }, { status: 400 });
      }
      
      result = await engine.placeOrder({
        userId: user.id,
        side: closingSide,
        orderType: 'LIMIT',
        positionType: closingPositionType,
        price: price,
        quantity: position.size,
        timeInForce: 'GTC'
      });
    }

    // Calculate average fill price
    const fills = result.matchResult.fills;
    const totalFillQty = fills.reduce((sum, fill) => sum + fill.quantity, 0);
    const avgFillPrice = fills.reduce((sum, fill) => sum + (fill.price * fill.quantity), 0) / totalFillQty;

    // Update position in database
    const [updatedPosition] = await prisma.$transaction([
      prisma.position.update({
        where: { id: position.id },
        data: {
          closedAt: new Date(),
          exitPrice: avgFillPrice
        }
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          balance: {
            increment: position.margin // Return the margin
          }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      position: updatedPosition,
      order: {
        id: result.orderId,
        fills: result.matchResult.fills
      }
    });

  } catch (error) {
    console.error('Error closing position via order book:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 