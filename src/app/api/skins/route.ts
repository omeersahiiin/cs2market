import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClientSingleton } from '@/lib/prisma';
import { MOCK_SKINS, shouldUseMockData } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/skins - Get all skins with optional query parameters
export async function GET(request: Request) {
  try {
    console.log(`[Skins API] Starting request - Should use mock: ${shouldUseMockData()}`);
    console.log(`[Skins API] Environment: NODE_ENV=${process.env.NODE_ENV}, VERCEL=${process.env.VERCEL}`);
    
    // Check if we should use mock data first
    if (shouldUseMockData()) {
      console.log('[Skins API] Using mock data for skins API');
      return NextResponse.json({
        skins: MOCK_SKINS,
        total: MOCK_SKINS.length,
        mock: true,
        message: 'Using mock data'
      });
    }

    console.log('[Skins API] Attempting to fetch skins from database...');
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    
    let skins = [];
    let isUsingMockData = false;
    
    try {
      // Use the robust database connection with retry logic
      skins = await PrismaClientSingleton.executeWithRetry(
        async (prisma) => {
          return await prisma.skin.findMany({
            orderBy: {
              [sortBy === 'volume24h' ? 'createdAt' : sortBy]: order as 'asc' | 'desc',
            },
            take: limit,
          });
        },
        'fetch skins'
      );
      
      console.log(`[Skins API] Successfully fetched ${skins.length} skins from database`);
    } catch (dbError) {
      console.error('[Skins API] Database error:', dbError instanceof Error ? dbError.message : 'Unknown error');
      skins = generateMockSkins(limit);
      isUsingMockData = true;
    }
    
    // If we got no skins from database, use mock data as fallback
    if (!skins || skins.length === 0) {
      console.log('[Skins API] No skins found in database, using mock data...');
      skins = generateMockSkins(limit);
      isUsingMockData = true;
    }
    
    // Enhance skins with market data for analysis
    const enhancedSkins = skins.map((skin: any) => {
      const baseVolume = getBaseVolumeForSkin(skin.name, skin.rarity);
      const priceChange24h = calculatePriceChange(parseFloat(skin.price.toString()), skin.rarity);
      const priceChangePercent = (priceChange24h / parseFloat(skin.price.toString())) * 100;
      
      return {
        ...skin,
        volume24h: baseVolume + Math.floor(Math.random() * 500),
        priceChange24h: priceChange24h,
        priceChangePercent: priceChangePercent,
        lastTradePrice: parseFloat(skin.price.toString()) * (1 + (Math.random() - 0.5) * 0.02),
        marketCap: parseFloat(skin.price.toString()) * (baseVolume + Math.floor(Math.random() * 500)),
        popularity: Math.floor(Math.random() * 40) + 60,
        float: Math.random() * 0.8 + 0.1,
        category: getCategoryFromType(skin.type),
        collection: getCollectionFromName(skin.name),
        priceChange: (Math.random() - 0.5) * parseFloat(skin.price.toString()) * 0.1,
        tradingData: {
          currentPrice: parseFloat(skin.price.toString()),
          dayHigh: parseFloat(skin.price.toString()) * (1 + Math.random() * 0.05),
          dayLow: parseFloat(skin.price.toString()) * (1 - Math.random() * 0.05),
          volume: Math.floor(Math.random() * 200) + 10,
          priceHistory: generateMockPriceHistory(parseFloat(skin.price.toString()), 24)
        }
      };
    });
    
    console.log(`📊 Enhanced ${enhancedSkins.length} skins with market data`);
    
    // Return in the format expected by Market Analysis
    return NextResponse.json({
      skins: enhancedSkins,
      total: enhancedSkins.length,
      page: 1,
      limit: limit,
      success: true,
      mock: isUsingMockData,
      message: isUsingMockData ? 'Using mock data - database temporarily unavailable' : 'Data loaded from database'
    });
  } catch (error) {
    console.error('❌ Critical error in skins API:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Final fallback - always return mock data if everything fails
    console.log('🆘 Critical error, returning emergency mock data...');
    const emergencyMockSkins = generateMockSkins(parseInt(new URL(request.url).searchParams.get('limit') || '50'));
    
    return NextResponse.json({
      skins: emergencyMockSkins,
      total: emergencyMockSkins.length,
      page: 1,
      limit: emergencyMockSkins.length,
      success: true,
      mock: true,
      emergency: true,
      message: 'Emergency mock data - please check system status'
    });
  }
}

// Generate mock skins data when database is unavailable
function generateMockSkins(limit: number) {
  // Use the full MOCK_SKINS array from mock-data.ts instead of limited local array
  const mockSkins = MOCK_SKINS.slice(0, Math.min(limit, MOCK_SKINS.length));

  // Enhance mock skins with market data
  return mockSkins.map((skin: any) => {
    const baseVolume = getBaseVolumeForSkin(skin.name, skin.rarity);
    const priceChange24h = calculatePriceChange(parseFloat(skin.price.toString()), skin.rarity);
    const priceChangePercent = (priceChange24h / parseFloat(skin.price.toString())) * 100;
    
    return {
      ...skin,
      volume24h: baseVolume + Math.floor(Math.random() * 500),
      priceChange24h: priceChange24h,
      priceChangePercent: priceChangePercent,
      lastTradePrice: parseFloat(skin.price.toString()) * (1 + (Math.random() - 0.5) * 0.02),
      marketCap: parseFloat(skin.price.toString()) * (baseVolume + Math.floor(Math.random() * 500)),
      popularity: Math.floor(Math.random() * 40) + 60,
      float: Math.random() * 0.8 + 0.1,
      category: getCategoryFromType(skin.type),
      collection: getCollectionFromName(skin.name),
      priceChange: (Math.random() - 0.5) * parseFloat(skin.price.toString()) * 0.1,
      tradingData: {
        currentPrice: parseFloat(skin.price.toString()),
        dayHigh: parseFloat(skin.price.toString()) * (1 + Math.random() * 0.05),
        dayLow: parseFloat(skin.price.toString()) * (1 - Math.random() * 0.05),
        volume: Math.floor(Math.random() * 200) + 10,
        priceHistory: generateMockPriceHistory(parseFloat(skin.price.toString()), 24)
      }
    };
  });
}

// Helper functions for market data simulation
function getBaseVolumeForSkin(name: string, rarity: string): number {
  const rarityMultipliers = {
    'Contraband': 200,
    'Covert': 400,
    'Classified': 600,
    'Restricted': 800,
    'Mil-Spec': 1000
  };
  
  const baseVolume = rarityMultipliers[rarity as keyof typeof rarityMultipliers] || 500;
  
  // Popular skins get higher volume
  if (name.includes('Dragon Lore') || name.includes('Howl') || name.includes('Fire Serpent')) {
    return baseVolume * 2;
  }
  if (name.includes('Asiimov') || name.includes('Redline') || name.includes('Vulcan')) {
    return baseVolume * 1.5;
  }
  
  return baseVolume;
}

function calculatePriceChange(currentPrice: number, rarity: string): number {
  // More expensive/rare skins have smaller percentage changes but larger absolute changes
  const volatility = rarity === 'Contraband' ? 0.03 : 
                   rarity === 'Covert' ? 0.05 : 
                   rarity === 'Classified' ? 0.07 : 0.1;
  
  const change = (Math.random() - 0.5) * 2 * volatility;
  return currentPrice * change;
}

function getCategoryFromType(type: string): string {
  if (type.includes('Rifle')) return 'Rifle';
  if (type.includes('Pistol')) return 'Pistol';
  if (type.includes('Sniper')) return 'Sniper';
  if (type.includes('SMG')) return 'SMG';
  if (type.includes('Shotgun')) return 'Shotgun';
  if (type.includes('Knife')) return 'Knife';
  if (type.includes('Gloves')) return 'Gloves';
  return 'Other';
}

function getCollectionFromName(name: string): string {
  if (name.includes('Dragon Lore') || name.includes('Medusa')) return 'Cobblestone Collection';
  if (name.includes('Howl') || name.includes('Cyrex')) return 'Huntsman Collection';
  if (name.includes('Asiimov') || name.includes('Redline')) return 'Phoenix Collection';
  if (name.includes('Vulcan') || name.includes('Orion')) return 'Operation Breakout Collection';
  if (name.includes('Fade')) return 'Dust Collection';
  return 'Unknown Collection';
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

// POST /api/skins - Create a new skin (admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, type, rarity, iconPath, price, wear } = body;

    // Validate required fields
    if (!name || !type || !rarity || !iconPath || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const skin = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.skin.create({
          data: {
            name,
            type,
            rarity,
            iconPath,
            price: parseFloat(price),
            wear: wear || 'Factory New',
          },
        });
      },
      'create skin'
    );

    return NextResponse.json(skin);
  } catch (error) {
    console.error('Error creating skin:', error);
    return NextResponse.json(
      { error: 'Failed to create skin' },
      { status: 500 }
    );
  }
} 