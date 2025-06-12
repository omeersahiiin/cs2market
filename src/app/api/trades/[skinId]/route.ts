import { NextRequest, NextResponse } from 'next/server';
import { shouldUseMockData, getMockRecentTrades } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

// GET /api/trades/[skinId] - Get recent trades for a skin
export async function GET(
  request: NextRequest,
  { params }: { params: { skinId: string } }
) {
  try {
    const { skinId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Check if we should use mock data
    if (shouldUseMockData()) {
      console.log('Using dynamic mock trades data for skin:', skinId);
      
      // Get dynamic mock trades data
      const recentTrades = getMockRecentTrades(skinId).slice(0, limit);
      
      return NextResponse.json({
        trades: recentTrades,
        count: recentTrades.length,
        timestamp: new Date().toISOString()
      });
    }

    // TODO: Implement database query for real trades
    // For now, return empty array when not in mock mode
    return NextResponse.json({
      trades: [],
      count: 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 