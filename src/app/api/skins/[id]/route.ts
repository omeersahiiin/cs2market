import { NextResponse } from 'next/server';
import { PrismaClientSingleton } from '@/lib/prisma';
import { MOCK_SKINS, getMockOrderBook, getMockRecentTrades, MOCK_FLOAT_ANALYSIS, MOCK_WEAR_ANALYSIS, shouldUseMockData } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  try {

    // Check if we should use mock data first
    if (shouldUseMockData()) {
      console.log('🎭 Using mock data for skin details API');
      const mockSkin = MOCK_SKINS.find(skin => skin.id === id) || MOCK_SKINS[0];
      
      return NextResponse.json({
        ...mockSkin,
        orderBook: getMockOrderBook(id),
        recentTrades: getMockRecentTrades(id),
        floatAnalysis: MOCK_FLOAT_ANALYSIS,
        wearAnalysis: MOCK_WEAR_ANALYSIS
      });
    }

    console.log(`🔍 Fetching skin details for ID: ${id}`);

    const skin = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.skin.findUnique({
          where: { id }
        });
      },
      `fetch skin details for ${id}`
    );

    if (!skin) {
      return NextResponse.json(
        { error: 'Skin not found' },
        { status: 404 }
      );
    }

    // Enhanced skin data with trading information
    const enhancedSkin = {
      ...skin,
      priceChange: (Math.random() - 0.5) * parseFloat(skin.price.toString()) * 0.1,
      priceChangePercent: (Math.random() - 0.5) * 20,
      volume24h: Math.floor(Math.random() * 1000000) + 100000,
      marketCap: Math.floor(Math.random() * 50000000) + 1000000,
      tradingData: {
        currentPrice: parseFloat(skin.price.toString()),
        dayHigh: parseFloat(skin.price.toString()) * (1 + Math.random() * 0.05),
        dayLow: parseFloat(skin.price.toString()) * (1 - Math.random() * 0.05),
        volume: Math.floor(Math.random() * 200) + 10,
        priceHistory: generateMockPriceHistory(parseFloat(skin.price.toString()), 24)
      },
      orderBook: generateMockOrderBook(parseFloat(skin.price.toString())),
      recentTrades: generateMockRecentTrades(parseFloat(skin.price.toString())),
      floatAnalysis: MOCK_FLOAT_ANALYSIS,
      wearAnalysis: MOCK_WEAR_ANALYSIS
    };

    console.log(`✅ Successfully fetched skin: ${skin.name}`);
    return NextResponse.json(enhancedSkin);

  } catch (error) {
    console.error('Database connection failed, falling back to mock data:', error);
    
    // Fallback to mock data if database fails
    const mockSkin = MOCK_SKINS.find(skin => skin.id === id) || MOCK_SKINS[0];
    return NextResponse.json({
      ...mockSkin,
      orderBook: getMockOrderBook(mockSkin.id),
      recentTrades: getMockRecentTrades(mockSkin.id),
      floatAnalysis: MOCK_FLOAT_ANALYSIS,
      wearAnalysis: MOCK_WEAR_ANALYSIS
    });
  }
}

function generateMockPriceHistory(basePrice: number, hours: number) {
  const history = [];
  let currentPrice = basePrice;
  
  for (let i = hours; i >= 0; i--) {
    const change = (Math.random() - 0.5) * 0.04; // ±2%
    currentPrice = currentPrice * (1 + change);
    
    history.push({
      timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      price: Math.round(currentPrice * 100) / 100,
      volume: Math.floor(Math.random() * 50) + 10
    });
  }
  
  return history;
}

function generateMockOrderBook(basePrice: number) {
  const spread = basePrice * 0.001; // 0.1% spread
  const bids = [];
  const asks = [];
  
  // Generate bids (below current price)
  for (let i = 0; i < 10; i++) {
    const price = basePrice - spread - (i * spread * 0.5);
    bids.push({
      price: Math.round(price * 100) / 100,
      quantity: Math.floor(Math.random() * 10) + 1,
      total: Math.round(price * (Math.floor(Math.random() * 10) + 1) * 100) / 100
    });
  }
  
  // Generate asks (above current price)
  for (let i = 0; i < 10; i++) {
    const price = basePrice + spread + (i * spread * 0.5);
    asks.push({
      price: Math.round(price * 100) / 100,
      quantity: Math.floor(Math.random() * 10) + 1,
      total: Math.round(price * (Math.floor(Math.random() * 10) + 1) * 100) / 100
    });
  }
  
  return { bids, asks };
}

function generateMockRecentTrades(basePrice: number) {
  const trades = [];
  
  for (let i = 0; i < 5; i++) {
    const price = basePrice * (1 + (Math.random() - 0.5) * 0.02); // ±1% variation
    trades.push({
      price: Math.round(price * 100) / 100,
      quantity: Math.floor(Math.random() * 5) + 1,
      timestamp: new Date(Date.now() - i * 30000).toISOString(),
      side: Math.random() > 0.5 ? 'buy' : 'sell'
    });
  }
  
  return trades;
} 