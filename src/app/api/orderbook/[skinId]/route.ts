import { NextRequest, NextResponse } from 'next/server';
import OrderMatchingEngine from '@/lib/orderMatchingEngine';
import { shouldUseMockData, getMockOrderBook, resetMockOrderBook } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/orderbook/[skinId] - Get order book for a skin
export async function GET(
  request: NextRequest,
  { params }: { params: { skinId: string } }
) {
  try {
    const { skinId } = params;
    const { searchParams } = new URL(request.url);
    const levels = parseInt(searchParams.get('levels') || '10');

    console.log(`[OrderBook API] Fetching order book for skin: ${skinId}, levels: ${levels}`);
    console.log(`[OrderBook API] Should use mock data: ${shouldUseMockData()}`);

    // Check if we should use mock data
    if (shouldUseMockData()) {
      console.log('[OrderBook API] Using mock data - real orders only');
      
      // Get only real user orders
      const mockOrderBook = getMockOrderBook(skinId);
      
      return NextResponse.json({
        orderBook: mockOrderBook,
        orderBookDepth: {
          bids: mockOrderBook.bids.slice(0, levels).map(bid => ({
            price: bid.price,
            quantity: bid.quantity,
            orders: 1
          })),
          asks: mockOrderBook.asks.slice(0, levels).map(ask => ({
            price: ask.price,
            quantity: ask.quantity,
            orders: 1
          }))
        },
        bestPrices: {
          bestBid: mockOrderBook.bids[0]?.price || 0,
          bestAsk: mockOrderBook.asks[0]?.price || 0,
          spread: (mockOrderBook.asks[0]?.price || 0) - (mockOrderBook.bids[0]?.price || 0)
        },
        marketPrice: ((mockOrderBook.asks[0]?.price || 0) + (mockOrderBook.bids[0]?.price || 0)) / 2,
        timestamp: new Date().toISOString()
      });
    }

    console.log('[OrderBook API] Using real database');

    // Initialize order matching engine with timeout
    const engine = new OrderMatchingEngine(skinId);

    // Get order book data with timeout and error handling
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 10000)
    );

    const dataPromise = Promise.all([
      engine.getOrderBook(),
      engine.getOrderBookDepth(levels),
      engine.getBestPrices(),
      engine.getMarketPrice()
    ]);

    const [orderBook, orderBookDepth, bestPrices, marketPrice] = await Promise.race([
      dataPromise,
      timeoutPromise
    ]) as any;

    console.log(`[OrderBook API] Successfully fetched data - bids: ${orderBook.bids.length}, asks: ${orderBook.asks.length}`);

    return NextResponse.json({
      orderBook,
      orderBookDepth,
      bestPrices,
      marketPrice,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[OrderBook API] Error fetching order book:', error);
    
    // Return empty order book on error instead of 500
    return NextResponse.json({
      orderBook: { bids: [], asks: [] },
      orderBookDepth: { bids: [], asks: [] },
      bestPrices: { bestBid: 0, bestAsk: 0, spread: 0 },
      marketPrice: 0,
      timestamp: new Date().toISOString(),
      error: 'Failed to fetch order book data'
    });
  }
} 