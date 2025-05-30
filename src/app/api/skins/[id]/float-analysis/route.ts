import { NextResponse } from 'next/server';
import { floatAnalysisService } from '@/lib/floatAnalysis';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const skinId = params.id;
    
    // Get or update float analysis
    await floatAnalysisService.updateFloatData(skinId);
    const analysis = await floatAnalysisService.getFloatAnalysis(skinId);
    
    if (!analysis) {
      return NextResponse.json(
        { error: 'Float analysis not available for this skin' },
        { status: 404 }
      );
    }

    return NextResponse.json({ floatAnalysis: analysis });
  } catch (error) {
    console.error('Error fetching float analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch float analysis' },
      { status: 500 }
    );
  }
}

// POST endpoint to get price impact for a specific float value
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const skinId = params.id;
    const { floatValue } = await request.json();
    
    if (typeof floatValue !== 'number' || floatValue < 0 || floatValue > 1) {
      return NextResponse.json(
        { error: 'Invalid float value. Must be between 0 and 1.' },
        { status: 400 }
      );
    }

    const impact = await floatAnalysisService.getFloatPriceImpact(skinId, floatValue);
    
    if (!impact) {
      return NextResponse.json(
        { error: 'Unable to calculate price impact for this float value' },
        { status: 404 }
      );
    }

    return NextResponse.json({ priceImpact: impact });
  } catch (error) {
    console.error('Error calculating float price impact:', error);
    return NextResponse.json(
      { error: 'Failed to calculate price impact' },
      { status: 500 }
    );
  }
} 