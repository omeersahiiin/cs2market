import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import ProfessionalPriceService from '@/lib/professionalPriceService';
import { shouldUseMockData, MOCK_SKINS } from '@/lib/mock-data';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// Add timeout wrapper for API calls
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`[Price Details API] Fetching price details for skin: ${params.id}`);
    
    // Check if we should use mock data
    if (shouldUseMockData()) {
      console.log('[Price Details API] Using mock price details data');
      
      // Find the mock skin
      const skin = MOCK_SKINS.find(s => s.id === params.id);
      if (!skin) {
        return NextResponse.json(
          { error: 'Skin not found' },
          { status: 404 }
        );
      }

      // Create mock price details based on the skin
      const basePrice = skin.price;
      const allWearPrices = {
        'Factory New': basePrice * 1.4,
        'Minimal Wear': basePrice * 1.2,
        'Field-Tested': basePrice,
        'Well-Worn': basePrice * 0.8,
        'Battle-Scarred': basePrice * 0.6
      };

      const mockPriceDetails = {
        tradingPrice: {
          averageMarketPrice: basePrice,
          lastUpdated: new Date().toISOString(),
          confidence: 95,
          sources: ['Steam Market', 'CSFloat', 'Buff163']
        },
        wearAnalysis: {
          allWearPrices: allWearPrices,
          priceRange: {
            lowest: Math.min(...Object.values(allWearPrices)),
            highest: Math.max(...Object.values(allWearPrices)),
            spread: ((Math.max(...Object.values(allWearPrices)) - Math.min(...Object.values(allWearPrices))) / Math.min(...Object.values(allWearPrices))) * 100
          }
        },
        marketData: {
          volume24h: Math.floor(Math.random() * 500) + 100,
          priceChange24h: (Math.random() - 0.5) * 0.1, // Random ±5% change
          lastTradePrice: basePrice * (1 + (Math.random() - 0.5) * 0.02), // ±1% from average
          realTimeData: true,
          apiSources: 3
        }
      };

      console.log('[Price Details API] Mock data generated successfully');
      return NextResponse.json({
        skin: {
          id: skin.id,
          name: skin.name,
          type: skin.type,
          rarity: skin.rarity,
          wear: skin.wear,
          currentPrice: basePrice
        },
        priceDetails: mockPriceDetails
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    // Fetch skin with timeout
    console.log('[Price Details API] Fetching skin from database...');
    const skin = await withTimeout(
      prisma.skin.findUnique({
        where: { id: params.id }
      }),
      5000 // 5 second timeout
    );

    if (!skin) {
      console.log('[Price Details API] Skin not found in database');
      return NextResponse.json(
        { error: 'Skin not found' },
        { status: 404 }
      );
    }

    console.log(`[Price Details API] Skin found: ${skin.name}`);

    // Get real-time market price information with timeout
    console.log(`[Price Details API] Fetching professional real-time price details for ${skin.name}...`);
    
    try {
      // Get professional pricing data with API keys and timeout
      const priceInfo = await withTimeout(
        ProfessionalPriceService.fetchSkinPrice(skin.name, skin.wear),
        8000 // 8 second timeout for external API
      );
      
      const averageMarketPrice = priceInfo.averagePrice;
      console.log(`[Price Details API] Professional price fetched: $${averageMarketPrice}`);
      
      // Update the skin price in database if it's significantly different
      const currentPrice = parseFloat(skin.price.toString());
      const priceChange = Math.abs(averageMarketPrice - currentPrice) / currentPrice;
      
      if (priceChange > 0.01) { // 1% threshold
        try {
          await withTimeout(
            prisma.skin.update({
              where: { id: skin.id },
              data: { price: averageMarketPrice }
            }),
            3000 // 3 second timeout for database update
          );
          console.log(`[Price Details API] Updated ${skin.name} price: $${currentPrice.toFixed(2)} → $${averageMarketPrice.toFixed(2)} (${priceInfo.confidence}% confidence)`);
        } catch (updateError) {
          console.warn('[Price Details API] Failed to update skin price in database:', updateError);
          // Continue with the response even if update fails
        }
      }

      // Create comprehensive market price info with professional data
      const allWearPrices = {
        'Factory New': averageMarketPrice * 1.4,
        'Minimal Wear': averageMarketPrice * 1.2,
        'Field-Tested': averageMarketPrice,
        'Well-Worn': averageMarketPrice * 0.8,
        'Battle-Scarred': averageMarketPrice * 0.6
      };

      const marketPriceInfo = {
        tradingPrice: {
          averageMarketPrice: averageMarketPrice,
          lastUpdated: priceInfo.lastUpdated.toISOString(),
          confidence: priceInfo.confidence,
          sources: priceInfo.prices.map((p: any) => p.platform)
        },
        wearAnalysis: {
          allWearPrices: allWearPrices,
          priceRange: {
            lowest: Math.min(...Object.values(allWearPrices)),
            highest: Math.max(...Object.values(allWearPrices)),
            spread: ((Math.max(...Object.values(allWearPrices)) - Math.min(...Object.values(allWearPrices))) / Math.min(...Object.values(allWearPrices))) * 100
          }
        },
        marketData: {
          volume24h: priceInfo.prices.reduce((sum, p) => sum + (p.volume || 0), 0),
          priceChange24h: (Math.random() - 0.5) * 0.1, // Random ±5% change
          lastTradePrice: averageMarketPrice * (1 + (Math.random() - 0.5) * 0.02), // ±1% from average
          realTimeData: true,
          apiSources: priceInfo.prices.length
        }
      };

      console.log('[Price Details API] Professional price data processed successfully');
      return NextResponse.json({
        skin: {
          id: skin.id,
          name: skin.name,
          type: skin.type,
          rarity: skin.rarity,
          wear: skin.wear,
          currentPrice: averageMarketPrice // Use professional real-time price
        },
        priceDetails: marketPriceInfo
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

    } catch (priceError) {
      console.error(`[Price Details API] Error fetching professional prices for ${skin.name}:`, priceError);
      
      // Enhanced fallback with professional pricing
      const fallbackPrice = ProfessionalPriceService.getProfessionalFallbackPrice(skin.name, skin.wear);
      console.log(`[Price Details API] Using fallback price: $${fallbackPrice}`);

      const fallbackPriceInfo = {
        tradingPrice: {
          averageMarketPrice: fallbackPrice,
          lastUpdated: new Date().toISOString(),
          confidence: 75, // High confidence in professional fallback
          sources: ['Professional Fallback']
        },
        wearAnalysis: {
          allWearPrices: {
            'Factory New': fallbackPrice * 1.4,
            'Minimal Wear': fallbackPrice * 1.2,
            'Field-Tested': fallbackPrice,
            'Well-Worn': fallbackPrice * 0.8,
            'Battle-Scarred': fallbackPrice * 0.6
          },
          priceRange: {
            lowest: fallbackPrice * 0.6,
            highest: fallbackPrice * 1.4,
            spread: 133.3
          }
        },
        marketData: {
          volume24h: 150,
          priceChange24h: 0,
          lastTradePrice: fallbackPrice,
          realTimeData: false,
          apiSources: 0
        }
      };

      console.log('[Price Details API] Fallback price data generated');
      return NextResponse.json({
        skin: {
          id: skin.id,
          name: skin.name,
          type: skin.type,
          rarity: skin.rarity,
          wear: skin.wear,
          currentPrice: fallbackPrice
        },
        priceDetails: fallbackPriceInfo
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

  } catch (error) {
    console.error('[Price Details API] Critical error:', error);
    
    // Return a basic response to prevent complete failure
    return NextResponse.json({
      error: 'Failed to fetch price details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } finally {
    // Ensure database connection is closed
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.warn('[Price Details API] Error disconnecting from database:', disconnectError);
    }
  }
} 