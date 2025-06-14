import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import OrderMatchingEngine from '@/lib/orderMatchingEngine';
import { shouldUseMockData, getMockOrders, cancelMockOrder } from '@/lib/mock-data';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// DELETE /api/orders/[orderId] - Cancel an order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    console.log(`[Cancel Order API] === CANCEL ORDER REQUEST START ===`);
    console.log(`[Cancel Order API] Order ID: ${params.orderId}`);
    console.log(`[Cancel Order API] Timestamp: ${new Date().toISOString()}`);
    console.log(`[Cancel Order API] Should use mock data: ${shouldUseMockData()}`);

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log(`[Cancel Order API] Unauthorized - no session`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[Cancel Order API] User email: ${session.user.email}`);
    console.log(`[Cancel Order API] Session user object:`, JSON.stringify(session.user, null, 2));

    // Check if we should use mock data
    if (shouldUseMockData()) {
      console.log('[Cancel Order API] Using mock data path');
      
      const { orderId } = params;
      
      // Use the actual session user ID - no mapping needed
      const userId = session.user.id || session.user.email; // Fallback to email if ID not available
      console.log(`[Cancel Order API] Using user ID: ${userId} for session user: ${session.user.email}`);
      
      if (!userId) {
        console.log(`[Cancel Order API] No user ID available in session`);
        return NextResponse.json({ error: 'User ID not available' }, { status: 400 });
      }
      
      const success = cancelMockOrder(orderId, userId);
      
      if (!success) {
        console.log(`[Cancel Order API] Mock order not found: ${orderId} for user: ${userId}`);
        
        // Let's also check what orders exist for debugging
        const allOrders = getMockOrders(userId);
        console.log(`[Cancel Order API] Available orders for user ${userId}:`, allOrders.map(o => ({ id: o.id, status: o.status })));
        
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      
      console.log(`[Cancel Order API] Mock order cancelled successfully: ${orderId}`);
      return NextResponse.json({ 
        order: { 
          id: orderId, 
          status: 'CANCELLED',
          cancelledAt: new Date().toISOString()
        } 
      });
    }

    console.log('[Cancel Order API] Using real database path');

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      console.log(`[Cancel Order API] User not found: ${session.user.email}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`[Cancel Order API] User found: ${user.id}`);

    const { orderId } = params;
    console.log(`[Cancel Order API] Looking for order: ${orderId} for user: ${user.id}`);

    // Get the order to find the skinId
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id
      }
    });

    if (!order) {
      console.log(`[Cancel Order API] Order not found: ${orderId} for user: ${user.id}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log(`[Cancel Order API] Order found:`, {
      id: order.id,
      status: order.status,
      skinId: order.skinId,
      side: order.side,
      orderType: order.orderType
    });

    // Initialize order matching engine
    const engine = new OrderMatchingEngine(order.skinId);
    console.log(`[Cancel Order API] Initialized matching engine for skin: ${order.skinId}`);

    // Cancel the order
    console.log(`[Cancel Order API] Attempting to cancel order...`);
    const success = await engine.cancelOrder(orderId, user.id);
    console.log(`[Cancel Order API] Cancel result: ${success}`);

    if (!success) {
      console.log(`[Cancel Order API] Failed to cancel order in matching engine`);
      return NextResponse.json({ error: 'Failed to cancel order' }, { status: 400 });
    }

    // Get updated order
    console.log(`[Cancel Order API] Fetching updated order...`);
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        skin: true,
        fills: true
      }
    });

    console.log(`[Cancel Order API] Updated order status: ${updatedOrder?.status}`);
    console.log(`[Cancel Order API] === CANCEL ORDER SUCCESS ===`);

    return NextResponse.json({ order: updatedOrder });

  } catch (error) {
    console.error('[Cancel Order API] === CANCEL ORDER FAILED ===');
    console.error('[Cancel Order API] Error:', error);
    console.error('[Cancel Order API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[Cancel Order API] === END ===');
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/orders/[orderId] - Get order details
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
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

    const { orderId } = params;

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id
      },
      include: {
        skin: true,
        fills: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 