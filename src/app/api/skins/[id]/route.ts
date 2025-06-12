import { NextResponse } from 'next/server';
import { PrismaClientSingleton } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔍 Fetching skin with ID: ${params.id}`);
    
    let skin = null;
    
    try {
      // Use the robust database connection with retry logic
      skin = await PrismaClientSingleton.executeWithRetry(
        async (prisma) => {
          return await prisma.skin.findUnique({
            where: {
              id: params.id
            }
          });
        },
        `fetch skin ${params.id}`
      );
      
      if (skin) {
        console.log(`✅ Successfully fetched skin: ${skin.name}`);
      }
    } catch (dbError) {
      console.log('⚠️ Database unavailable, checking mock data...', dbError instanceof Error ? dbError.message : 'Unknown error');
    }
    
    // If no skin found in database, try to find in mock data
    if (!skin) {
      console.log('📦 Skin not found in database, using mock data...');
      const mockSkins = [
        {
          id: '1',
          name: 'AK-47 | Redline',
          type: 'Rifle',
          rarity: 'Classified',
          iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhhwszHeDFH6OO6nYeDg7mtYbiJkjoDvcAlj7yVotmtjAfjrkpoZW36IoaWclM3MFnY8lK9k-vnm9bi67lSw9Es',
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
          iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17P7NdTRH-t26q4SZlvD7PYTQgXtu5Mx2gv2P9o6migzl_Us5ZmCmLYDDJgU9NA6B81S5yezvg8e-7cycnXJgvHZx5WGdwUJqz1Tl4g',
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
          iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJQJD_9W7m5a0mvLwOq7c2GlUucFwjruR9t7231DmrRc_NW7yItCRcVNoYVHS-APrwbzu0JK-78nXiSw0EnwDRM0',
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
          iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszLaQJF4NdJgIKKnYynxbr2l2hSsJci37-VotKhj1K2qEFkfTv3JYGXdQ43Y17W-lK5yLjrg8e87ZXMnWwj5HdmNhfPYA',
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
          iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJB09C_k4mfnvjJJ7rDhWpBuPxj7ou08I3J-VK8xQs3MA',
          price: 151.25,
          wear: 'Field-Tested',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      skin = mockSkins.find(s => s.id === params.id);
      
      if (skin) {
        console.log(`✅ Found skin in mock data: ${skin.name}`);
      }
    }

    if (!skin) {
      console.log(`❌ Skin with ID ${params.id} not found in database or mock data`);
      return NextResponse.json(
        { error: 'Skin not found' },
        { status: 404 }
      );
    }

    // Enhance skin with trading data
    const enhancedSkin = {
      ...skin,
      volume24h: Math.floor(Math.random() * 1000) + 100,
      priceChange24h: (Math.random() - 0.5) * 20,
      popularity: Math.floor(Math.random() * 40) + 60,
      float: Math.random() * 0.8 + 0.1,
      category: getCategoryFromType(skin.type),
      canTrade: true
    };

    return NextResponse.json(enhancedSkin);
  } catch (error) {
    console.error('❌ Critical error fetching skin:', {
      error,
      skinId: params.id,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch skin details',
        message: 'Service temporarily unavailable, please try again later'
      },
      { status: 500 }
    );
  }
}

function getCategoryFromType(type: string): string {
  const categoryMap: { [key: string]: string } = {
    'Rifle': 'Primary',
    'Sniper Rifle': 'Primary', 
    'SMG': 'Primary',
    'Shotgun': 'Primary',
    'Machine Gun': 'Primary',
    'Pistol': 'Secondary',
    'Knife': 'Melee',
    'Gloves': 'Equipment'
  };
  
  return categoryMap[type] || 'Other';
} 