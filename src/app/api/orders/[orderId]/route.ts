import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OrderMatchingEngine from '@/lib/orderMatchingEngine';
import { PrismaClientSingleton } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// DELETE /api/orders/[orderId] - Cancel an order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
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
      'fetch user for cancel order'
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { orderId } = params;

    // Get the order to find the skinId
    const order = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.order.findFirst({
          where: {
            id: orderId,
            userId: user.id
          }
        });
      },
      'fetch order for cancellation'
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Initialize order matching engine
    const engine = new OrderMatchingEngine(order.skinId);

    // Cancel the order
    const success = await engine.cancelOrder(orderId, user.id);

    if (!success) {
      return NextResponse.json({ error: 'Failed to cancel order' }, { status: 400 });
    }

    // Get updated order
    const updatedOrder = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            skin: true,
            fills: true
          }
        });
      },
      'fetch updated order after cancellation'
    );

    return NextResponse.json({ order: updatedOrder });

  } catch (error) {
    console.error('Cancel order error:', error);
    return NextResponse.json({ 
      error: 'Internal server error'
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

    const user = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.user.findUnique({
          where: { email: session.user.email }
        });
      },
      'fetch user for get order'
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { orderId } = params;

    const order = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.order.findFirst({
          where: {
            id: orderId,
            userId: user.id
          },
          include: {
            skin: true,
            fills: true
          }
        });
      },
      'fetch order details'
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 