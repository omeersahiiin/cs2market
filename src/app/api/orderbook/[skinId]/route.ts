import { NextRequest, NextResponse } from 'next/server';
import OrderMatchingEngine from '@/lib/orderMatchingEngine';
import { shouldUseMockData, MOCK_ORDER_BOOK } from '@/lib/mock-data';

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

    // Check if we should use mock data
    if (shouldUseMockData()) {
      console.log('Using mock order book data');
      
      // Return mock order book data
      return NextResponse.json({
        orderBook: MOCK_ORDER_BOOK,
        orderBookDepth: {
          bids: MOCK_ORDER_BOOK.bids.slice(0, levels).map(bid => ({
            price: bid.price,
            quantity: bid.quantity,
            orders: 1
          })),
          asks: MOCK_ORDER_BOOK.asks.slice(0, levels).map(ask => ({
            price: ask.price,
            quantity: ask.quantity,
            orders: 1
          }))
        },
        bestPrices: {
          bestBid: MOCK_ORDER_BOOK.bids[0]?.price,
          bestAsk: MOCK_ORDER_BOOK.asks[0]?.price,
          spread: MOCK_ORDER_BOOK.asks[0]?.price - MOCK_ORDER_BOOK.bids[0]?.price
        },
        marketPrice: (MOCK_ORDER_BOOK.asks[0]?.price + MOCK_ORDER_BOOK.bids[0]?.price) / 2,
        timestamp: new Date().toISOString()
      });
    }

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