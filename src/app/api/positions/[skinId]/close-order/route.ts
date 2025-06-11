import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, Prisma } from '@prisma/client';
import OrderMatchingEngine from '@/lib/orderMatchingEngine';

const prisma = new PrismaClient();

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
    
    // Create fill record
    fills.push({
      buyOrderId: side === 'BUY' ? 'market-close' : bookOrder.id,
      sellOrderId: side === 'SELL' ? 'market-close' : bookOrder.id,
      price: fillPrice,
      quantity: fillQty,
      buyUserId: side === 'BUY' ? userId : bookOrder.userId,
      sellUserId: side === 'SELL' ? userId : bookOrder.userId
    });
    
    // Update the book order
    const newRemainingQty = bookOrder.remainingQty - fillQty;
    updatedOrders.push({
      orderId: bookOrder.id,
      newRemainingQty: newRemainingQty,
      status: newRemainingQty === 0 ? 'FILLED' : 'PARTIAL'
    });
    
    remainingQty -= fillQty;
  }
  
  // Execute the fills in the database
  if (fills.length > 0) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update the matched orders
      for (const update of updatedOrders) {
        await tx.order.update({
          where: { id: update.orderId },
          data: {
            remainingQty: update.newRemainingQty,
            filledQty: {
              increment: fills
                .filter(f => f.buyOrderId === update.orderId || f.sellOrderId === update.orderId)
                .reduce((sum, f) => sum + f.quantity, 0)
            },
            status: update.status,
            filledAt: update.status === 'FILLED' ? new Date() : undefined
          }
        });
      }
    });
  }
  
  return { 
    orderId: 'market-close', 
    matchResult: { fills, updatedOrders } 
  };
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
    // If we have a LONG position, we need to SELL to close
    // If we have a SHORT position, we need to BUY to close
    const closingSide = position.type === 'LONG' ? 'SELL' : 'BUY';
    const closingPositionType = position.type === 'LONG' ? 'SHORT' : 'LONG';

    // Initialize order matching engine
    const engine = new OrderMatchingEngine(skinId);

    let result;
    
    if (orderType === 'MARKET') {
      // For market orders, execute immediately against the order book
      result = await executeMarketClose(engine, user.id, closingSide, position.size);
      
      if (!result.matchResult.fills.length) {
        return NextResponse.json({ error: 'No liquidity available for market close' }, { status: 400 });
      }
    } else {
      // For limit orders, place order in the book
      if (!price || price <= 0) {
        return NextResponse.json({ error: 'Invalid limit price' }, { status: 400 });
      }
      
      result = await engine.placeOrder({
        userId: user.id,
        side: closingSide as 'BUY' | 'SELL',
        orderType: 'LIMIT',
        positionType: (position.type === 'LONG' ? 'SHORT' : 'LONG') as 'LONG' | 'SHORT',
        price: price,
        quantity: position.size,
        timeInForce: 'GTC'
      });
    }

    // If order was filled (fully or partially), close the position
    if (result.matchResult.fills.length > 0) {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Calculate filled quantity and average fill price
        const userFills = result.matchResult.fills.filter(
          fill => fill.buyUserId === user.id || fill.sellUserId === user.id
        );
        
        const totalFilledQty = userFills.reduce((sum, fill) => sum + fill.quantity, 0);
        const avgFillPrice = userFills.reduce((sum, fill) => sum + (fill.price * fill.quantity), 0) / totalFilledQty;
        
        if (totalFilledQty > 0) {
          // Calculate P&L
          const pnlPerUnit = position.type === 'LONG' 
            ? avgFillPrice - position.entryPrice 
            : position.entryPrice - avgFillPrice;
          const totalPnL = pnlPerUnit * totalFilledQty;
          
          // Calculate commission on closing trade
          const tradeValue = avgFillPrice * totalFilledQty;
          const commission = tradeValue * 0.0002; // 0.02%
          
          // Net P&L after commission
          const netPnL = totalPnL - commission;
          
          // Return margin and add/subtract P&L
          const marginToReturn = position.margin * (totalFilledQty / position.size);
          const balanceChange = marginToReturn + netPnL;
          
          // Update user balance
          await tx.user.update({
            where: { id: user.id },
            data: {
              balance: {
                increment: balanceChange
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
          
          if (totalFilledQty >= position.size) {
            // Position fully closed
            await tx.position.update({
              where: { id: position.id },
              data: {
                exitPrice: avgFillPrice,
                closedAt: new Date()
              }
            });
          } else {
            // Position partially closed - reduce size and margin
            const remainingSize = position.size - totalFilledQty;
            const remainingMargin = position.margin * (remainingSize / position.size);
            
            await tx.position.update({
              where: { id: position.id },
              data: {
                size: remainingSize,
                margin: remainingMargin
              }
            });
          }
        }
      });
    }

    // Get updated position
    const updatedPosition = await prisma.position.findUnique({
      where: { id: position.id },
      include: {
        skin: true
      }
    });

    // Get the closing order details
    const closingOrder = result.orderId ? await prisma.order.findUnique({
      where: { id: result.orderId },
      include: {
        skin: true,
        fills: true
      }
    }) : null;

    return NextResponse.json({
      position: updatedPosition,
      closingOrder: closingOrder,
      matchResult: result.matchResult,
      message: result.matchResult.fills.length > 0 
        ? 'Position closed successfully through order book'
        : 'Closing order placed in order book'
    });

  } catch (error) {
    console.error('Error closing position via order book:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 