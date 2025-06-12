import { NextResponse } from 'next/server';
import { floatAnalysisService } from '@/lib/floatAnalysis';
import { shouldUseMockData } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const skinId = params.id;
    
    // Check if we should use mock data
    if (shouldUseMockData()) {
      console.log('Using mock float analysis data');
      const mockAnalysis = {
        skinId,
        skinName: 'AWP | Dragon Lore',
        wearConditions: {
          'Factory New': {
            floatRange: { min: 0.00, max: 0.07 },
            avgFloat: 0.035,
            avgPrice: 15000,
            sampleSize: 25,
            priceRanges: [
              { floatMin: 0.00, floatMax: 0.02, avgPrice: 18000, sampleSize: 8, priceMultiplier: 1.2 },
              { floatMin: 0.02, floatMax: 0.05, avgPrice: 15000, sampleSize: 12, priceMultiplier: 1.0 },
              { floatMin: 0.05, floatMax: 0.07, avgPrice: 13000, sampleSize: 5, priceMultiplier: 0.87 }
            ]
          },
          'Field-Tested': {
            floatRange: { min: 0.15, max: 0.38 },
            avgFloat: 0.25,
            avgPrice: 7500,
            sampleSize: 45,
            priceRanges: [
              { floatMin: 0.15, floatMax: 0.20, avgPrice: 8500, sampleSize: 15, priceMultiplier: 0.57 },
              { floatMin: 0.20, floatMax: 0.30, avgPrice: 7500, sampleSize: 20, priceMultiplier: 0.5 },
              { floatMin: 0.30, floatMax: 0.38, avgPrice: 6500, sampleSize: 10, priceMultiplier: 0.43 }
            ]
          }
        },
        floatImpact: {
          priceVariation: 176.9,
          mostValuable: { wear: 'Factory New', floatRange: '0.000-0.020', multiplier: 1.2 },
          leastValuable: { wear: 'Field-Tested', floatRange: '0.300-0.380', multiplier: 0.43 }
        },
        recommendations: {
          bestValue: { wear: 'Field-Tested', reason: 'Best balance between price and visual quality' },
          investment: { wear: 'Factory New', reason: 'Highest appreciation potential and rarity' },
          trading: { wear: 'Minimal Wear', reason: 'High liquidity and stable demand' }
        }
      };
      
      return NextResponse.json({ floatAnalysis: mockAnalysis });
    }
    
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

    // Check if we should use mock data
    if (shouldUseMockData()) {
      console.log('Using mock price impact data');
      const mockImpact = {
        wear: floatValue < 0.07 ? 'Factory New' : floatValue < 0.15 ? 'Minimal Wear' : floatValue < 0.38 ? 'Field-Tested' : floatValue < 0.45 ? 'Well-Worn' : 'Battle-Scarred',
        estimatedPrice: 7500 * (floatValue < 0.07 ? 1.8 : floatValue < 0.15 ? 1.3 : floatValue < 0.38 ? 1.0 : floatValue < 0.45 ? 0.75 : 0.6),
        priceMultiplier: floatValue < 0.07 ? 1.8 : floatValue < 0.15 ? 1.3 : floatValue < 0.38 ? 1.0 : floatValue < 0.45 ? 0.75 : 0.6,
        rarity: floatValue < 0.02 ? 'Very Rare' : floatValue < 0.05 ? 'Rare' : floatValue < 0.15 ? 'Uncommon' : 'Common',
        marketPrice: 7500,
        priceEffect: {
          absoluteChange: (7500 * (floatValue < 0.07 ? 1.8 : floatValue < 0.15 ? 1.3 : floatValue < 0.38 ? 1.0 : floatValue < 0.45 ? 0.75 : 0.6)) - 7500,
          percentageChange: ((floatValue < 0.07 ? 1.8 : floatValue < 0.15 ? 1.3 : floatValue < 0.38 ? 1.0 : floatValue < 0.45 ? 0.75 : 0.6) - 1) * 100,
          similarFloats: [
            { min: Math.max(0, floatValue - 0.02), max: Math.min(1, floatValue + 0.02), avgPrice: 7500 }
          ]
        }
      };
      
      return NextResponse.json({ priceImpact: mockImpact });
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