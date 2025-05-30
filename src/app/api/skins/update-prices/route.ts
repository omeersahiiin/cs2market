import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import RealPriceService from '@/lib/realPriceService';

export const dynamic = 'force-dynamic';

// Background price update service
let isUpdating = false;
let updateInterval: NodeJS.Timeout | null = null;

export async function POST() {
  try {
    if (isUpdating) {
      return NextResponse.json({ 
        message: 'Price update already in progress',
        status: 'running'
      });
    }

    console.log('🚀 Starting background price update service...');
    isUpdating = true;

    // Get all skins
    const skins = await prisma.skin.findMany();
    const updateResults = [];

    for (const skin of skins) {
      try {
        console.log(`📊 Updating ${skin.name}...`);
        
        // Get real market price
        const realPrice = await RealPriceService.getAverageMarketPrice(skin.name);
        const currentPrice = parseFloat(skin.price.toString());
        
        // Update if price has changed significantly or if it's still around $52 (problematic)
        const priceChange = Math.abs(realPrice - currentPrice) / currentPrice;
        const isProblematicPrice = currentPrice >= 50 && currentPrice <= 55;
        
        if (priceChange > 0.01 || isProblematicPrice) { // 1% threshold or problematic price
          await prisma.skin.update({
            where: { id: skin.id },
            data: { price: realPrice }
          });
          
          console.log(`💰 Updated ${skin.name}: $${currentPrice.toFixed(2)} → $${realPrice.toFixed(2)}`);
          updateResults.push({
            skinName: skin.name,
            oldPrice: currentPrice,
            newPrice: realPrice,
            change: priceChange * 100
          });
        } else {
          console.log(`✅ ${skin.name}: Price stable at $${currentPrice.toFixed(2)}`);
        }
        
      } catch (error) {
        console.error(`❌ Error updating ${skin.name}:`, error);
        updateResults.push({
          skinName: skin.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    isUpdating = false;
    
    return NextResponse.json({
      message: 'Price update completed',
      updatedSkins: updateResults.length,
      results: updateResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    isUpdating = false;
    console.error('❌ Error in price update service:', error);
    return NextResponse.json({ 
      error: 'Price update failed',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Start continuous background updates every 10 seconds
    if (updateInterval) {
      clearInterval(updateInterval);
    }

    console.log('🔄 Starting continuous price updates every 10 seconds...');
    
    updateInterval = setInterval(async () => {
      if (!isUpdating) {
        try {
          console.log('⏰ Scheduled price update starting...');
          
          const skins = await prisma.skin.findMany();
          let updatedCount = 0;

          for (const skin of skins) {
            try {
              const realPrice = await RealPriceService.getAverageMarketPrice(skin.name);
              const currentPrice = parseFloat(skin.price.toString());
              
              // Update if significant change or problematic price
              const priceChange = Math.abs(realPrice - currentPrice) / currentPrice;
              const isProblematicPrice = currentPrice >= 50 && currentPrice <= 55;
              
              if (priceChange > 0.01 || isProblematicPrice) {
                await prisma.skin.update({
                  where: { id: skin.id },
                  data: { price: realPrice }
                });
                
                console.log(`💰 Auto-updated ${skin.name}: $${currentPrice.toFixed(2)} → $${realPrice.toFixed(2)}`);
                updatedCount++;
              }
              
            } catch (error) {
              console.error(`❌ Auto-update error for ${skin.name}:`, error);
            }
          }
          
          console.log(`✅ Scheduled update completed. Updated ${updatedCount} skins.`);
          
        } catch (error) {
          console.error('❌ Scheduled update failed:', error);
        }
      }
    }, 10000); // 10 seconds

    return NextResponse.json({
      message: 'Continuous price updates started',
      interval: '10 seconds',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error starting continuous updates:', error);
    return NextResponse.json({ 
      error: 'Failed to start continuous updates',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
      console.log('🛑 Stopped continuous price updates');
    }

    return NextResponse.json({
      message: 'Continuous price updates stopped',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error stopping updates:', error);
    return NextResponse.json({ 
      error: 'Failed to stop updates',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 