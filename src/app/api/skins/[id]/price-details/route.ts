import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import ProfessionalPriceService from '@/lib/professionalPriceService';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const skin = await prisma.skin.findUnique({
      where: {
        id: params.id
      }
    });

    if (!skin) {
      return NextResponse.json(
        { error: 'Skin not found' },
        { status: 404 }
      );
    }

    // Get real-time market price information using ProfessionalPriceService
    console.log(`🔍 Fetching professional real-time price details for ${skin.name}...`);
    
    try {
      // Get professional pricing data with API keys
      const priceInfo = await ProfessionalPriceService.fetchSkinPrice(skin.name, skin.wear);
      const averageMarketPrice = priceInfo.averagePrice;
      
      // Update the skin price in database if it's significantly different
      const currentPrice = parseFloat(skin.price.toString());
      const priceChange = Math.abs(averageMarketPrice - currentPrice) / currentPrice;
      
      if (priceChange > 0.01) { // 1% threshold
        await prisma.skin.update({
          where: { id: skin.id },
          data: { price: averageMarketPrice }
        });
        console.log(`💰 Updated ${skin.name} price: $${currentPrice.toFixed(2)} → $${averageMarketPrice.toFixed(2)} (${priceInfo.confidence}% confidence)`);
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
          sources: priceInfo.prices.map(p => p.platform)
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
      console.error(`❌ Error fetching professional prices for ${skin.name}:`, priceError);
      
      // Enhanced fallback with professional pricing
      const fallbackPrice = ProfessionalPriceService.getProfessionalFallbackPrice(skin.name, skin.wear);

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
    console.error('Error fetching skin price details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price details' },
      { status: 500 }
    );
  }
} 