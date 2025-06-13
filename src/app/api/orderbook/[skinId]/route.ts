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
  const startTime = Date.now();
  
  try {
    const { skinId } = params;
    const { searchParams } = new URL(request.url);
    const levels = parseInt(searchParams.get('levels') || '10');

    console.log(`[OrderBook API] === ORDER BOOK REQUEST START ===`);
    console.log(`[OrderBook API] Timestamp: ${new Date().toISOString()}`);
    console.log(`[OrderBook API] Skin ID: ${skinId}`);
    console.log(`[OrderBook API] Levels requested: ${levels}`);
    console.log(`[OrderBook API] Environment check:`);
    console.log(`[OrderBook API] - NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`[OrderBook API] - VERCEL: ${process.env.VERCEL}`);
    console.log(`[OrderBook API] - DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
    console.log(`[OrderBook API] - Should use mock data: ${shouldUseMockData()}`);

    // Check if we should use mock data
    if (shouldUseMockData()) {
      console.log('[OrderBook API] Using mock data path');
      
      // Get only real user orders
      const mockOrderBook = getMockOrderBook(skinId);
      
      console.log(`[OrderBook API] Mock order book - Bids: ${mockOrderBook.bids.length}, Asks: ${mockOrderBook.asks.length}`);
      
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

    console.log('[OrderBook API] === REAL DATABASE PATH ===');

    // Initialize order matching engine with timeout
    const engine = new OrderMatchingEngine(skinId);

    console.log('[OrderBook API] Step 1: Initializing order matching engine...');

    // Get order book data with timeout and error handling
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout after 15 seconds')), 15000)
    );

    console.log('[OrderBook API] Step 2: Fetching order book data...');
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

    console.log(`[OrderBook API] Step 3: Data fetched successfully`);
    console.log(`[OrderBook API] - Order book bids: ${orderBook.bids.length}`);
    console.log(`[OrderBook API] - Order book asks: ${orderBook.asks.length}`);
    console.log(`[OrderBook API] - Order book depth bids: ${orderBookDepth.bids.length}`);
    console.log(`[OrderBook API] - Order book depth asks: ${orderBookDepth.asks.length}`);
    console.log(`[OrderBook API] - Best bid: ${bestPrices.bestBid}`);
    console.log(`[OrderBook API] - Best ask: ${bestPrices.bestAsk}`);
    console.log(`[OrderBook API] - Market price: ${marketPrice}`);

    // Log detailed order information for debugging
    if (orderBook.bids.length > 0) {
      console.log('[OrderBook API] Sample bid orders:');
      orderBook.bids.slice(0, 3).forEach((bid: any, index: number) => {
        console.log(`[OrderBook API] Bid ${index + 1}: ID=${bid.id}, Price=${bid.price}, Qty=${bid.remainingQty}, User=${bid.userId}`);
      });
    }

    if (orderBook.asks.length > 0) {
      console.log('[OrderBook API] Sample ask orders:');
      orderBook.asks.slice(0, 3).forEach((ask: any, index: number) => {
        console.log(`[OrderBook API] Ask ${index + 1}: ID=${ask.id}, Price=${ask.price}, Qty=${ask.remainingQty}, User=${ask.userId}`);
      });
    }

    const totalTime = Date.now() - startTime;
    console.log(`[OrderBook API] === ORDER BOOK SUCCESS ===`);
    console.log(`[OrderBook API] Total processing time: ${totalTime}ms`);
    console.log(`[OrderBook API] === END ===`);

    return NextResponse.json({
      orderBook,
      orderBookDepth,
      bestPrices,
      marketPrice,
      timestamp: new Date().toISOString(),
      debug: {
        processingTime: totalTime,
        totalBids: orderBook.bids.length,
        totalAsks: orderBook.asks.length
      }
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('[OrderBook API] === ORDER BOOK FAILED ===');
    console.error('[OrderBook API] Error:', error);
    console.error('[OrderBook API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error(`[OrderBook API] Total processing time: ${totalTime}ms`);
    console.error('[OrderBook API] === END ===');
    
    // Return empty order book on error instead of 500
    return NextResponse.json({
      orderBook: { bids: [], asks: [] },
      orderBookDepth: { bids: [], asks: [] },
      bestPrices: { bestBid: 0, bestAsk: 0, spread: 0 },
      marketPrice: 0,
      timestamp: new Date().toISOString(),
      error: 'Failed to fetch order book data',
      debug: {
        processingTime: totalTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
} 