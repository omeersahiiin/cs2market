import { NextResponse } from 'next/server';
import MarketMaker from '@/lib/marketMaker';

export const dynamic = 'force-dynamic';

// POST /api/market-maker/run - Manually trigger market making
export async function POST() {
  try {
    console.log('Running market maker...');
    await MarketMaker.runMarketMaking();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Market making completed' 
    });
  } catch (error) {
    console.error('Error running market maker:', error);
    return NextResponse.json({ 
      error: 'Failed to run market maker' 
    }, { status: 500 });
  }
} 