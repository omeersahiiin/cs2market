import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdvancedOrderManager } from '@/lib/advancedOrderTypes';

export const dynamic = 'force-dynamic';

// POST /api/orders/take-profit - Create a take-profit order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { skinId, positionId, triggerPrice, quantity } = body;

    if (!skinId || !triggerPrice || !quantity) {
      return NextResponse.json({ 
        error: 'Missing required fields: skinId, triggerPrice, quantity' 
      }, { status: 400 });
    }

    if (!positionId) {
      return NextResponse.json({ 
        error: 'Position ID is required for take-profit orders' 
      }, { status: 400 });
    }

    const orderManager = AdvancedOrderManager.getInstance();
    
    const orderId = await orderManager.createTakeProfit({
      userId: session.user.id,
      skinId,
      positionId,
      triggerPrice: parseFloat(triggerPrice),
      quantity: parseFloat(quantity)
    });

    return NextResponse.json({ 
      success: true, 
      orderId,
      message: 'Take-profit order created successfully'
    });

  } catch (error) {
    console.error('Error creating take-profit order:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
} 