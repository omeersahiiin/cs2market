import { PrismaClientSingleton } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { ProfessionalPriceService } from '@/lib/professionalPriceService';

export const dynamic = 'force-dynamic';

// Background price update service
let isUpdating = false;
let updateInterval: NodeJS.Timeout | null = null;

export async function POST() {
  try {
    console.log('🔄 Starting bulk price update...');
    
    const skins = await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.skin.findMany();
      },
      'fetch all skins for price update'
    );

    let updatedCount = 0;
    const errors: string[] = [];
    const priceService = ProfessionalPriceService.getInstance();

    for (const skin of skins) {
      try {
        const newPrice = await priceService.getAverageMarketPrice(skin.name);
        
        if (newPrice && newPrice !== parseFloat(skin.price.toString())) {
          await PrismaClientSingleton.executeWithRetry(
            async (prisma) => {
              return await prisma.skin.update({
            where: { id: skin.id },
                data: { 
                  price: newPrice,
                  updatedAt: new Date()
                }
              });
            },
            `update price for ${skin.name}`
          );
          
          updatedCount++;
          console.log(`✅ Updated ${skin.name}: $${skin.price} → $${newPrice}`);
        }
      } catch (error) {
        const errorMsg = `Failed to update ${skin.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error('❌', errorMsg);
      }
    }

    console.log(`🎉 Price update complete: ${updatedCount}/${skins.length} skins updated`);
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} out of ${skins.length} skins`,
      updatedCount,
      totalSkins: skins.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Bulk price update failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update prices',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Start continuous background updates every 10 seconds
    if (updateInterval) {
      clearInterval(updateInterval);
    }

    console.log('🔄 Starting continuous price updates every 10 seconds...');
    const priceService = ProfessionalPriceService.getInstance();
    
    updateInterval = setInterval(async () => {
      if (!isUpdating) {
        try {
          console.log('⏰ Scheduled price update starting...');
          
          const skins = await PrismaClientSingleton.executeWithRetry(
            async (prisma) => {
              return await prisma.skin.findMany();
            },
            'fetch all skins for price update'
          );
          let updatedCount = 0;

          for (const skin of skins) {
            try {
              const realPrice = await priceService.getAverageMarketPrice(skin.name);
              const currentPrice = parseFloat(skin.price.toString());
              
              // Update if significant change or problematic price
              const priceChange = Math.abs(realPrice - currentPrice) / currentPrice;
              const isProblematicPrice = currentPrice >= 50 && currentPrice <= 55;
              
              if (priceChange > 0.01 || isProblematicPrice) {
                await PrismaClientSingleton.executeWithRetry(
                  async (prisma) => {
                    return await prisma.skin.update({
                  where: { id: skin.id },
                      data: { 
                        price: realPrice,
                        updatedAt: new Date()
                      }
                });
                  },
                  `update price for ${skin.name}`
                );
                
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