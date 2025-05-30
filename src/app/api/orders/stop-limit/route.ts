import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdvancedOrderManager } from '@/lib/advancedOrderTypes';

export const dynamic = 'force-dynamic';

// POST /api/orders/stop-limit - Create a stop-limit order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { skinId, triggerPrice, limitPrice, side, positionType, quantity } = body;

    if (!skinId || !triggerPrice || !limitPrice || !side || !positionType || !quantity) {
      return NextResponse.json({ 
        error: 'Missing required fields: skinId, triggerPrice, limitPrice, side, positionType, quantity' 
      }, { status: 400 });
    }

    const orderManager = AdvancedOrderManager.getInstance();
    
    const orderId = await orderManager.createStopLimit({
      userId: session.user.id,
      skinId,
      triggerPrice: parseFloat(triggerPrice),
      limitPrice: parseFloat(limitPrice),
      side: side as 'BUY' | 'SELL',
      positionType: positionType as 'LONG' | 'SHORT',
      quantity: parseFloat(quantity)
    });

    return NextResponse.json({ 
      success: true, 
      orderId,
      message: 'Stop-limit order created successfully'
    });

  } catch (error) {
    console.error('Error creating stop-limit order:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
} 