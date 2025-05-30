import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdvancedOrderManager } from '@/lib/advancedOrderTypes';

export const dynamic = 'force-dynamic';

// DELETE /api/orders/conditional/[orderId] - Cancel a conditional order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json({ 
        error: 'Order ID is required' 
      }, { status: 400 });
    }

    const orderManager = AdvancedOrderManager.getInstance();
    const success = await orderManager.cancelConditionalOrder(orderId, session.user.id);

    if (!success) {
      return NextResponse.json({ 
        error: 'Order not found or cannot be cancelled' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling conditional order:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 