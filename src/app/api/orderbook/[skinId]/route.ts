import { NextRequest, NextResponse } from 'next/server';
import OrderMatchingEngine from '@/lib/orderMatchingEngine';

export const dynamic = 'force-dynamic';

// GET /api/orderbook/[skinId] - Get order book for a skin
export async function GET(
  request: NextRequest,
  { params }: { params: { skinId: string } }
) {
  try {
    const { skinId } = params;
    const { searchParams } = new URL(request.url);
    const levels = parseInt(searchParams.get('levels') || '10');

    // Initialize order matching engine
    const engine = new OrderMatchingEngine(skinId);

    // Get order book data
    const [orderBook, orderBookDepth, bestPrices, marketPrice] = await Promise.all([
      engine.getOrderBook(),
      engine.getOrderBookDepth(levels),
      engine.getBestPrices(),
      engine.getMarketPrice()
    ]);

    return NextResponse.json({
      orderBook,
      orderBookDepth,
      bestPrices,
      marketPrice,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching order book:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 