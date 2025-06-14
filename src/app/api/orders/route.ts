import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OrderMatchingEngine from '@/lib/orderMatchingEngine';
import { shouldUseMockData, MOCK_SKINS, addMockOrder, addMockTrade, getMockOrders } from '@/lib/mock-data';
import { mapMockIdToRealId, isMockId } from '@/lib/skin-id-mapping';
import { PrismaClientSingleton } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Mock orders data - this will be populated dynamically
let MOCK_ORDERS: any[] = [];

// GET /api/orders - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[Orders API] Fetching orders for user: ${session.user.email}`);
    console.log(`[Orders API] Should use mock data: ${shouldUseMockData()}`);

    // Check if we should use mock data
    if (shouldUseMockData()) {
      console.log('[Orders API] Using mock orders data');
      
      const { searchParams } = new URL(request.url);
      const skinId = searchParams.get('skinId');
      const status = searchParams.get('status');
      
      // Handle multiple status values separated by commas
      const statusFilter = status ? status.split(',').map((s: any) => s.trim()) : undefined;
      
      // Get filtered orders using the new function
      const filteredOrders = getMockOrders(session.user.id, skinId || undefined, statusFilter);
      
      return NextResponse.json({ orders: filteredOrders });
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

    // Map mock skin ID to real database ID if needed
    const realSkinId = skinId && isMockId(skinId) ? mapMockIdToRealId(skinId) : skinId;

    const orders = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.order.findMany({
          where: {
            userId: user.id,
            ...(realSkinId && { skinId: realSkinId }),
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

    console.log(`[Orders API] Successfully fetched ${orders.length} orders`);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('[Orders API] Error fetching orders:', error);
    
    // Return empty orders array on error instead of 500
    return NextResponse.json({ 
      orders: [],
      error: 'Failed to fetch orders'
    });
  }
}

// POST /api/orders - Place a new order
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('[Orders API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[Orders API] Failed to parse request body:', parseError);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { skinId, side, orderType, positionType, price, quantity, timeInForce } = body;

    console.log(`[Orders API] === ORDER PLACEMENT START ===`);
    console.log(`[Orders API] Timestamp: ${new Date().toISOString()}`);
    console.log(`[Orders API] User: ${session.user.email}`);
    console.log(`[Orders API] Order details:`, { skinId, side, orderType, positionType, price, quantity });
    console.log(`[Orders API] Environment check:`);
    console.log(`[Orders API] - NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`[Orders API] - VERCEL: ${process.env.VERCEL}`);
    console.log(`[Orders API] - DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
    console.log(`[Orders API] - Should use mock data: ${shouldUseMockData()}`);

    // Validate required fields
    if (!skinId || !side || !orderType || !positionType || !quantity) {
      console.error('[Orders API] Missing required fields:', { skinId, side, orderType, positionType, quantity });
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'skinId, side, orderType, positionType, and quantity are required'
      }, { status: 400 });
    }

    // Validate order type and price
    if (orderType === 'LIMIT' && (!price || price <= 0)) {
      console.error('[Orders API] Invalid limit order price:', price);
      return NextResponse.json({ 
        error: 'Limit orders require a valid price',
        details: 'Price must be greater than 0 for limit orders'
      }, { status: 400 });
    }

    // Validate quantity
    if (quantity <= 0 || !Number.isFinite(quantity)) {
      console.error('[Orders API] Invalid quantity:', quantity);
      return NextResponse.json({ 
        error: 'Quantity must be a positive number',
        details: `Received quantity: ${quantity}`
      }, { status: 400 });
    }

    // Validate side and position type
    if (!['BUY', 'SELL'].includes(side.toUpperCase())) {
      console.error('[Orders API] Invalid side:', side);
      return NextResponse.json({ 
        error: 'Invalid order side',
        details: 'Side must be BUY or SELL'
      }, { status: 400 });
    }

    if (!['LONG', 'SHORT'].includes(positionType.toUpperCase())) {
      console.error('[Orders API] Invalid position type:', positionType);
      return NextResponse.json({ 
        error: 'Invalid position type',
        details: 'Position type must be LONG or SHORT'
      }, { status: 400 });
    }

    // Check if we should use mock data
    if (shouldUseMockData()) {
      console.log('[Orders API] Using mock data path');
      
      // Find the skin
      const skin = MOCK_SKINS.find(s => s.id === skinId);
      if (!skin) {
        console.error('[Orders API] Mock skin not found:', skinId);
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
        console.log('[Orders API] Created mock position:', newPosition.id);
      }

      console.log('[Orders API] Mock order created successfully:', newOrder.id);

      return NextResponse.json({
        order: newOrder,
        matchResult: {
          fills: newOrder.fills,
          remainingQuantity: newOrder.remainingQty,
          status: newOrder.status
        }
      });
    }

    // Real database order placement
    console.log('[Orders API] === REAL DATABASE PATH ===');

    // Add timeout wrapper for database operations with enhanced error handling
    const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs);
      });
      
      try {
        const result = await Promise.race([promise, timeoutPromise]);
        console.log(`[Orders API] ${operation} completed successfully`);
        return result;
      } catch (error) {
        console.error(`[Orders API] ${operation} failed:`, error);
        throw error;
      }
    };

    console.log('[Orders API] Step 1: Fetching user...');
    const user = await withTimeout(
      PrismaClientSingleton.executeWithRetry(
        async (prisma) => {
          return await prisma.user.findUnique({
            where: { email: session.user.email }
          });
        },
        'fetch user for order placement'
      ),
      10000, // 10 second timeout
      'User fetch'
    );

    if (!user) {
      console.error('[Orders API] User not found:', session.user.email);
      return NextResponse.json({ 
        error: 'User not found',
        details: 'User account not found in database'
      }, { status: 404 });
    }

    console.log('[Orders API] User found:', { id: user.id, balance: user.balance });

    // Map mock skin ID to real database ID if needed
    const realSkinId = isMockId(skinId) ? mapMockIdToRealId(skinId) : skinId;
    console.log(`[Orders API] Step 2: Skin ID mapping: ${skinId} -> ${realSkinId}`);

    // Check if skin exists
    console.log('[Orders API] Step 3: Fetching skin...');
    const skin = await withTimeout(
      PrismaClientSingleton.executeWithRetry(
        async (prisma) => {
          return await prisma.skin.findUnique({
            where: { id: realSkinId }
          });
        },
        'fetch skin for order placement'
      ),
      10000, // 10 second timeout
      'Skin fetch'
    );

    if (!skin) {
      console.error(`[Orders API] Skin not found with ID: ${skinId} (mapped to: ${realSkinId})`);
      return NextResponse.json({ 
        error: 'Skin not found',
        details: `Skin ID "${skinId}" (mapped to "${realSkinId}") does not exist in database`
      }, { status: 404 });
    }

    console.log('[Orders API] Skin found:', { id: skin.id, name: skin.name, price: skin.price });

    // Calculate required margin (20% of position value)
    const estimatedPrice = price || skin.price;
    const positionValue = estimatedPrice * quantity;
    const requiredMargin = positionValue * 0.2; // 20% margin requirement

    console.log('[Orders API] Step 4: Margin calculation:', {
      estimatedPrice,
      positionValue,
      requiredMargin,
      userBalance: user.balance
    });

    // Check if user has sufficient balance
    if (user.balance < requiredMargin) {
      console.error('[Orders API] Insufficient balance:', {
        required: requiredMargin,
        available: user.balance,
        shortfall: requiredMargin - user.balance
      });
      return NextResponse.json({ 
        error: 'Insufficient balance for margin requirement',
        details: `Required: $${(requiredMargin || 0).toFixed(2)}, Available: $${(user.balance || 0).toFixed(2)}`,
        required: requiredMargin,
        available: user.balance
      }, { status: 400 });
    }

    console.log('[Orders API] Step 5: Balance check passed, initializing order matching engine...');

    // Initialize order matching engine with real skin ID
    const engine = new OrderMatchingEngine(realSkinId);

    console.log('[Orders API] Step 6: Placing order in matching engine...');
    // Place the order with timeout
    const result = await withTimeout(
      engine.placeOrder({
        userId: user.id,
        side: side as 'BUY' | 'SELL',
        orderType: orderType as 'MARKET' | 'LIMIT',
        positionType: positionType as 'LONG' | 'SHORT',
        price: orderType === 'LIMIT' ? price : undefined,
        quantity,
        timeInForce
      }),
      20000, // 20 second timeout for order placement
      'Order placement in matching engine'
    );

    console.log('[Orders API] Step 7: Order placed in engine:', {
      orderId: result.orderId,
      fillsCount: result.matchResult.fills.length,
      updatedOrdersCount: result.matchResult.updatedOrders.length
    });

    // If order was filled (fully or partially), create positions and update balance
    if (result.matchResult.fills.length > 0) {
      console.log('[Orders API] Step 8: Order has fills, creating position and updating balance...');
      
      await withTimeout(
        PrismaClientSingleton.executeWithRetry(
          async (prisma) => {
            return await prisma.$transaction(async (tx: any) => {
              // Calculate total filled quantity and average fill price
              const userFills = result.matchResult.fills.filter(
                fill => fill.buyUserId === user.id || fill.sellUserId === user.id
              );
              
              const totalFilledQty = userFills.reduce((sum, fill) => sum + fill.quantity, 0);
              const avgFillPrice = userFills.reduce((sum, fill) => sum + (fill.price * fill.quantity), 0) / totalFilledQty;
              
              console.log('[Orders API] Fill details:', {
                userFillsCount: userFills.length,
                totalFilledQty,
                avgFillPrice
              });
              
              if (totalFilledQty > 0) {
                // Calculate commission (0.02% of trade value)
                const tradeValue = avgFillPrice * totalFilledQty;
                const commission = tradeValue * 0.0002; // 0.02%
                
                console.log('[Orders API] Creating position:', {
                  userId: user.id,
                  skinId: realSkinId,
                  type: positionType,
                  entryPrice: avgFillPrice,
                  size: totalFilledQty,
                  margin: avgFillPrice * totalFilledQty * 0.2
                });
                
                // Create position for filled quantity
                await tx.position.create({
                  data: {
                    userId: user.id,
                    skinId: realSkinId,
                    type: positionType,
                    entryPrice: avgFillPrice,
                    size: totalFilledQty,
                    margin: avgFillPrice * totalFilledQty * 0.2
                  }
                });

                // Deduct margin + commission from user balance
                const marginUsed = avgFillPrice * totalFilledQty * 0.2;
                const totalDeduction = marginUsed + commission;
                
                console.log('[Orders API] Updating user balance:', {
                  marginUsed,
                  commission,
                  totalDeduction,
                  newBalance: user.balance - totalDeduction
                });
                
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
                  console.log('[Orders API] Commission transferred to market maker:', commission);
                }
              }
            });
          },
          'create position and update balance'
        ),
        25000, // 25 second timeout for transaction
        'Position creation and balance update'
      );
    } else {
      console.log('[Orders API] Step 8: Order placed but no fills (limit order in order book)');
    }

    console.log('[Orders API] Step 9: Fetching updated order details...');
    // Get updated order details
    const updatedOrder = await withTimeout(
      PrismaClientSingleton.executeWithRetry(
        async (prisma) => {
          return await prisma.order.findUnique({
            where: { id: result.orderId },
            include: {
              skin: true,
              fills: true
            }
          });
        },
        'fetch updated order details'
      ),
      10000, // 10 second timeout
      'Updated order fetch'
    );

    if (!updatedOrder) {
      console.error('[Orders API] Failed to fetch updated order details');
      throw new Error('Failed to fetch updated order details');
    }

    const totalTime = Date.now() - startTime;
    console.log(`[Orders API] === ORDER PLACEMENT SUCCESS ===`);
    console.log(`[Orders API] Order ID: ${result.orderId}`);
    console.log(`[Orders API] Final status: ${updatedOrder.status}`);
    console.log(`[Orders API] Remaining quantity: ${updatedOrder.remainingQty}`);
    console.log(`[Orders API] Fills: ${result.matchResult.fills.length}`);
    console.log(`[Orders API] Total processing time: ${totalTime}ms`);
    console.log(`[Orders API] === END ===`);

    return NextResponse.json({
      order: updatedOrder,
      matchResult: result.matchResult
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('[Orders API] === ORDER PLACEMENT FAILED ===');
    console.error('[Orders API] Error:', error);
    console.error('[Orders API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error(`[Orders API] Total processing time: ${totalTime}ms`);
    console.error('[Orders API] === END ===');
    
    // Return more specific error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const isTimeoutError = errorMessage.includes('timed out');
    const isDatabaseError = errorMessage.includes('database') || errorMessage.includes('prisma') || errorMessage.includes('connection');
    
    return NextResponse.json({ 
      error: 'Failed to place order',
      details: errorMessage,
      type: isTimeoutError ? 'timeout' : isDatabaseError ? 'database' : 'general',
      suggestion: isTimeoutError ? 'Please try again. The system may be experiencing high load.' : 
                  isDatabaseError ? 'Database connection issue. Please try again in a moment.' :
                  'Please check your order details and try again.',
      processingTime: totalTime
    }, { status: 500 });
  }
} 