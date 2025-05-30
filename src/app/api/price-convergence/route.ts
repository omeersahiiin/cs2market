import { NextRequest, NextResponse } from 'next/server';
import { PriceOracle } from '@/lib/priceOracle';
import { FundingRateManager } from '@/lib/fundingRate';
import { MarketMaker } from '@/lib/marketMaker';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const priceOracle = PriceOracle.getInstance();
    const fundingManager = FundingRateManager.getInstance();
    const marketMaker = MarketMaker.getInstance();

    // Get all skins
    const skins = await prisma.skin.findMany();
    
    const convergenceData = [];

    for (const skin of skins) {
      try {
        // Get price convergence data
        const priceData = await priceOracle.checkPriceConvergence(skin.id);
        
        // Get funding rate data
        const fundingData = await fundingManager.getCurrentFundingRate(skin.id);
        
        // Get position counts
        const positionCounts = await prisma.position.groupBy({
          by: ['type'],
          where: {
            skinId: skin.id,
            closedAt: null
          },
          _count: {
            id: true
          },
          _sum: {
            size: true
          }
        });

        const longPositions = positionCounts.find(p => p.type === 'LONG');
        const shortPositions = positionCounts.find(p => p.type === 'SHORT');

        convergenceData.push({
          skinId: skin.id,
          skinName: skin.name,
          externalPrice: priceData.externalPrice,
          internalPrice: priceData.internalPrice,
          deviation: priceData.deviation,
          deviationPercent: (priceData.deviation / priceData.externalPrice) * 100,
          convergenceActions: priceData.convergenceActions,
          fundingRate: fundingData.rate,
          fundingDirection: fundingData.direction,
          fundingReason: fundingData.reason,
          longPositions: {
            count: longPositions?._count.id || 0,
            totalSize: longPositions?._sum.size || 0
          },
          shortPositions: {
            count: shortPositions?._count.id || 0,
            totalSize: shortPositions?._sum.size || 0
          },
          netPosition: (longPositions?._sum.size || 0) - (shortPositions?._sum.size || 0)
        });
      } catch (error) {
        console.error(`Error processing ${skin.name}:`, error);
        convergenceData.push({
          skinId: skin.id,
          skinName: skin.name,
          error: 'Failed to fetch data'
        });
      }
    }

    // Get market maker stats
    const marketMakerStats = await marketMaker.getMarketMakerStats();

    return NextResponse.json({
      convergenceData,
      marketMakerStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in price convergence API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST endpoint to trigger manual convergence actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, skinId } = body;

    const marketMaker = MarketMaker.getInstance();
    const fundingManager = FundingRateManager.getInstance();

    switch (action) {
      case 'run_market_making':
        if (skinId) {
          const skin = await prisma.skin.findUnique({ where: { id: skinId } });
          if (skin) {
            await marketMaker.placeMarketMakingOrders(skinId, skin.name);
          }
        } else {
          await marketMaker.runMarketMaking();
        }
        return NextResponse.json({ message: 'Market making executed' });

      case 'apply_funding':
        if (skinId) {
          await fundingManager.applyFundingRate(skinId);
        } else {
          await fundingManager.scheduleFundingRates();
        }
        return NextResponse.json({ message: 'Funding rates applied' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in price convergence action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 