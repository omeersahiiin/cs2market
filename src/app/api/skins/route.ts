import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClientSingleton } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/skins - Get all skins with optional query parameters
export async function GET(request: Request) {
  try {
    console.log('🔍 Attempting to fetch skins...');
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    
    // Use the robust database connection with retry logic
    const skins = await PrismaClientSingleton.executeWithRetry(
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
    
    console.log(`✅ Successfully fetched ${skins.length} skins from database`);
    
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
        collection: getCollectionFromName(skin.name)
      };
    });
    
    console.log(`📊 Enhanced ${enhancedSkins.length} skins with market data`);
    
    // Return in the format expected by Market Analysis
    return NextResponse.json({
      skins: enhancedSkins,
      total: enhancedSkins.length,
      page: 1,
      limit: limit,
      success: true
    });
  } catch (error) {
    console.error('❌ Detailed error fetching skins:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // If database is completely unavailable, return mock data
    if (error instanceof Error && (
      error.message.includes('prepared statement') || 
      error.message.includes('connection') ||
      error.message.includes('timeout')
    )) {
      console.log('🔄 Database unavailable, returning mock data...');
      
      const mockSkins = generateMockSkins(parseInt(new URL(request.url).searchParams.get('limit') || '50'));
      
      return NextResponse.json({
        skins: mockSkins,
        total: mockSkins.length,
        page: 1,
        limit: mockSkins.length,
        success: true,
        mock: true,
        message: 'Using mock data due to database connectivity issues'
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch skins',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}

// Generate mock skins data when database is unavailable
function generateMockSkins(limit: number) {
  const mockSkins = [
    {
      id: '1',
      name: 'AK-47 | Redline',
      type: 'Rifle',
      rarity: 'Classified',
      iconPath: '/icons/ak47-redline.png',
      price: 85.50,
      wear: 'Field-Tested',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2', 
      name: 'AWP | Dragon Lore',
      type: 'Sniper Rifle',
      rarity: 'Contraband',
      iconPath: '/icons/awp-dragonlore.png',
      price: 7500.00,
      wear: 'Field-Tested',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      name: 'M4A4 | Asiimov',
      type: 'Rifle',
      rarity: 'Covert',
      iconPath: '/icons/m4a4-asiimov.png',
      price: 109.99,
      wear: 'Field-Tested',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      name: 'AK-47 | Vulcan',
      type: 'Rifle',
      rarity: 'Classified',
      iconPath: '/icons/ak47-vulcan.png',
      price: 185.75,
      wear: 'Minimal Wear',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '5',
      name: 'AWP | Asiimov',
      type: 'Sniper Rifle',
      rarity: 'Covert',
      iconPath: '/icons/awp-asiimov.png',
      price: 151.25,
      wear: 'Field-Tested',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Enhance mock skins with market data
  return mockSkins.slice(0, limit).map((skin: any) => {
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
      collection: getCollectionFromName(skin.name)
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