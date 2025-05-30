import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import RealPriceService from '@/lib/realPriceService';

export const dynamic = 'force-dynamic';

// Update interval - 10 seconds for real API calls (as requested by user)
const PRICE_UPDATE_INTERVAL = 10000;
const MIN_PRICE_CHANGE_THRESHOLD = 0.02; // Only send updates for changes > 2%

// Store last sent prices to avoid sending unchanged prices
let lastSentPrices: Record<string, number> = {};

export async function GET() {
  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout | null = null;
  let isControllerClosed = false;
  
  const stream = new ReadableStream({
    async start(controller) {
      console.log('🚀 Starting real-time price updates with live data...');
      
      try {
        // Send initial prices
        const skins = await prisma.skin.findMany();
        const initialPrices = skins.reduce((acc: Record<string, number>, skin: any) => {
          acc[skin.id] = parseFloat(skin.price.toString());
          lastSentPrices[skin.id] = parseFloat(skin.price.toString());
          return acc;
        }, {} as Record<string, number>);

        if (!isControllerClosed) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialPrices)}\n\n`));
        }

        // Set up interval for price updates
        intervalId = setInterval(async () => {
          if (isControllerClosed) {
            if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
            }
            return;
          }

          try {
            console.log('🔄 Fetching real-time prices from trading platforms...');
            const skins = await prisma.skin.findMany();
            
            // Fetch real-time prices from multiple platforms using REAL APIs
            const priceUpdates: Record<string, number> = {};

            for (const skin of skins) {
              try {
                console.log(`📊 Processing ${skin.name}...`);
                
                // Use real average market price across all wears for unified liquidity
                const averageMarketPrice = await RealPriceService.getAverageMarketPrice(skin.name);
                
                if (averageMarketPrice && lastSentPrices[skin.id]) {
                  // Check if the change is significant for database update
                  const priceChange = Math.abs(averageMarketPrice - lastSentPrices[skin.id]) / lastSentPrices[skin.id];
                  if (priceChange > MIN_PRICE_CHANGE_THRESHOLD) {
                    // Update price in database for significant changes
                    await prisma.skin.update({
                      where: { id: skin.id },
                      data: { price: averageMarketPrice }
                    });
                    
                    console.log(`💰 Updated ${skin.name}: $${lastSentPrices[skin.id].toFixed(2)} → $${averageMarketPrice.toFixed(2)} (${(priceChange * 100).toFixed(1)}% change)`);
                    lastSentPrices[skin.id] = averageMarketPrice;
                  }
                  // Always include in updates to trigger frontend refresh
                  priceUpdates[skin.id] = lastSentPrices[skin.id];
                } else if (averageMarketPrice) {
                  // First time or no previous price
                  await prisma.skin.update({
                    where: { id: skin.id },
                    data: { price: averageMarketPrice }
                  });

                  console.log(`🆕 Set initial price for ${skin.name}: $${averageMarketPrice.toFixed(2)}`);
                  priceUpdates[skin.id] = averageMarketPrice;
                  lastSentPrices[skin.id] = averageMarketPrice;
                }
              } catch (skinError) {
                console.error(`❌ Error processing ${skin.name}:`, skinError);
                // Keep existing price if individual skin fails
                priceUpdates[skin.id] = lastSentPrices[skin.id] || parseFloat(skin.price.toString());
              }
            }

            // Only send updates if controller is still open
            if (!isControllerClosed) {
              if (Object.keys(priceUpdates).length > 0) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(priceUpdates)}\n\n`));
                console.log(`📡 Sent price updates for ${Object.keys(priceUpdates).length} skins`);
              } else {
                // Send heartbeat with current timestamp
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ heartbeat: Date.now() })}\n\n`));
                console.log('💓 Sent heartbeat');
              }
            }
          } catch (error) {
            console.error('❌ Error in price update cycle:', error);
            // Only send error if controller is still open
            if (!isControllerClosed) {
              try {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ heartbeat: Date.now(), error: 'Update failed' })}\n\n`));
              } catch (enqueueError) {
                console.error('❌ Failed to send error message, controller likely closed');
                isControllerClosed = true;
              }
            }
          }
        }, PRICE_UPDATE_INTERVAL);

      } catch (error) {
        console.error('❌ Error in stream start:', error);
        isControllerClosed = true;
      }
    },

    cancel() {
      console.log('🛑 Stream cancelled, cleaning up...');
      isControllerClosed = true;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
} 