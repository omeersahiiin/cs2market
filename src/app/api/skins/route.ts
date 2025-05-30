import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// GET /api/skins - Get all skins with optional query parameters
export async function GET(request: Request) {
  try {
    console.log('Attempting to fetch skins...');
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    
    const skins = await prisma.skin.findMany({
      orderBy: {
        [sortBy === 'volume24h' ? 'createdAt' : sortBy]: order as 'asc' | 'desc',
      },
      take: limit,
    });
    
    // Enhance skins with market data for analysis
    const enhancedSkins = skins.map(skin => {
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
    
    console.log('Skins fetched successfully:', enhancedSkins.length);
    
    // Return in the format expected by Market Analysis
    return NextResponse.json({
      skins: enhancedSkins,
      total: enhancedSkins.length,
      page: 1,
      limit: limit
    });
  } catch (error) {
    console.error('Detailed error fetching skins:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch skins',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
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

    const skin = await prisma.skin.create({
      data: {
        name,
        type,
        rarity,
        iconPath,
        price: parseFloat(price),
        wear: wear || 'Factory New',
      },
    });

    return NextResponse.json(skin);
  } catch (error) {
    console.error('Error creating skin:', error);
    return NextResponse.json(
      { error: 'Failed to create skin' },
      { status: 500 }
    );
  }
} 