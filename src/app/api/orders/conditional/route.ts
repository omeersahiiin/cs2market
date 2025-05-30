import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdvancedOrderManager } from '@/lib/advancedOrderTypes';

export const dynamic = 'force-dynamic';

// GET /api/orders/conditional - Get user's conditional orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const skinId = searchParams.get('skinId');

    const orderManager = AdvancedOrderManager.getInstance();
    const orders = await orderManager.getUserConditionalOrders(
      session.user.id,
      skinId || undefined
    );

    return NextResponse.json({ 
      orders,
      count: orders.length
    });

  } catch (error) {
    console.error('Error fetching conditional orders:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 