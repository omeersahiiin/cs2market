import { PrismaClient } from '@prisma/client';
import { OrderMatchingEngine } from './orderMatchingEngine';
import { PriceOracle } from './priceOracle';

const prisma = new PrismaClient();

/**
 * Round price to 2 decimal places to avoid floating-point precision issues
 */
function roundPrice(price: number): number {
  return Math.round(price * 100) / 100;
}

export class MarketMaker {
  private static instance: MarketMaker;
  private priceOracle: PriceOracle;

  constructor() {
    this.priceOracle = PriceOracle.getInstance();
  }

  public static getInstance(): MarketMaker {
    if (!MarketMaker.instance) {
      MarketMaker.instance = new MarketMaker();
    }
    return MarketMaker.instance;
  }

  /**
   * Place market making orders with price convergence logic
   */
  async placeMarketMakingOrders(skinId: string, skinName: string): Promise<void> {
    try {
      // Get market maker account
      const marketMaker = await prisma.user.findUnique({
        where: { email: 'marketmaker@cs2derivatives.com' }
      });

      if (!marketMaker) {
        console.error('Market maker account not found');
        return;
      }

      // Get price convergence data
      const convergenceData = await this.priceOracle.checkPriceConvergence(skinId);
      const externalPrice = convergenceData.externalPrice;
      const internalPrice = convergenceData.internalPrice;
      const deviation = Math.abs(externalPrice - internalPrice);
      const deviationPercent = (deviation / externalPrice) * 100;

      // Get current order book
      const engine = new OrderMatchingEngine(skinId);
      const { bestBid, bestAsk } = await engine.getBestPrices();

      // Adjust spread based on deviation
      let baseSpread = 0.5; // Default $0.50 spread
      
      if (deviationPercent > 5) {
        // Increase spread when prices are misaligned
        baseSpread = Math.min(deviationPercent * 0.2, 2.0); // Max $2.00 spread
      }

      // Calculate target prices based on external price (not internal)
      let targetBid: number;
      let targetAsk: number;

      if (internalPrice > externalPrice) {
        // Internal price too high - bias towards selling
        // Place asks closer to external price to encourage selling
        targetBid = roundPrice(externalPrice - baseSpread * 0.7);
        targetAsk = roundPrice(externalPrice + baseSpread * 0.3);
      } else if (internalPrice < externalPrice) {
        // Internal price too low - bias towards buying  
        // Place bids closer to external price to encourage buying
        targetBid = roundPrice(externalPrice - baseSpread * 0.3);
        targetAsk = roundPrice(externalPrice + baseSpread * 0.7);
      } else {
        // Prices aligned - normal spread
        targetBid = roundPrice(externalPrice - baseSpread / 2);
        targetAsk = roundPrice(externalPrice + baseSpread / 2);
      }

      // Only place orders if they would improve the market or fill gaps
      const shouldPlaceBid = !bestBid || bestBid < targetBid - 0.01;
      const shouldPlaceAsk = !bestAsk || bestAsk > targetAsk + 0.01;

      // Cancel existing market maker orders that are too far from target
      await this.cancelOutdatedOrders(skinId, marketMaker.id, targetBid, targetAsk);

      // Place bid order if needed
      if (shouldPlaceBid && marketMaker.balance > targetBid * 10 * 0.2) {
        try {
          await engine.placeOrder({
            userId: marketMaker.id,
            side: 'BUY',
            orderType: 'LIMIT',
            positionType: 'LONG',
            price: targetBid,
            quantity: 10,
            timeInForce: 'GTC'
          });
          console.log(`Market maker placed BID at $${targetBid.toFixed(2)} for ${skinName} (external: $${externalPrice.toFixed(2)})`);
        } catch (error) {
          console.error('Error placing market maker bid:', error);
        }
      }

      // Place ask order if needed
      if (shouldPlaceAsk && marketMaker.balance > targetAsk * 10 * 0.2) {
        try {
          await engine.placeOrder({
            userId: marketMaker.id,
            side: 'SELL',
            orderType: 'LIMIT',
            positionType: 'SHORT',
            price: targetAsk,
            quantity: 10,
            timeInForce: 'GTC'
          });
          console.log(`Market maker placed ASK at $${targetAsk.toFixed(2)} for ${skinName} (external: $${externalPrice.toFixed(2)})`);
        } catch (error) {
          console.error('Error placing market maker ask:', error);
        }
      }

      // Log convergence status
      if (deviationPercent > 2) {
        console.log(`Price convergence needed for ${skinName}:`);
        console.log(`  External: $${externalPrice.toFixed(2)}`);
        console.log(`  Internal: $${internalPrice.toFixed(2)}`);
        console.log(`  Deviation: ${deviationPercent.toFixed(2)}%`);
        console.log(`  Target spread: $${baseSpread.toFixed(2)}`);
      }

    } catch (error) {
      console.error('Error in market making:', error);
    }
  }

  /**
   * Cancel market maker orders that are too far from target prices
   */
  private async cancelOutdatedOrders(
    skinId: string, 
    marketMakerId: string, 
    targetBid: number, 
    targetAsk: number
  ): Promise<void> {
    const orders = await prisma.order.findMany({
      where: {
        skinId,
        userId: marketMakerId,
        status: { in: ['PENDING', 'PARTIAL'] },
        remainingQty: { gt: 0 }
      }
    });

    const engine = new OrderMatchingEngine(skinId);

    for (const order of orders) {
      let shouldCancel = false;

      if (order.side === 'BUY' && Math.abs(order.price - targetBid) > 1.0) {
        shouldCancel = true;
      } else if (order.side === 'SELL' && Math.abs(order.price - targetAsk) > 1.0) {
        shouldCancel = true;
      }

      if (shouldCancel) {
        await engine.cancelOrder(order.id, marketMakerId);
        console.log(`Cancelled outdated market maker order: ${order.side} $${order.price.toFixed(2)}`);
      }
    }
  }

  /**
   * Run market making for all skins
   */
  async runMarketMaking(): Promise<void> {
    const skins = await prisma.skin.findMany();
    
    for (const skin of skins) {
      try {
        await this.placeMarketMakingOrders(skin.id, skin.name);
        // Add small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error in market making for ${skin.name}:`, error);
      }
    }
  }

  /**
   * Get market maker statistics
   */
  async getMarketMakerStats(): Promise<any> {
    const marketMaker = await prisma.user.findUnique({
      where: { email: 'marketmaker@cs2derivatives.com' },
      include: {
        orders: {
          where: {
            status: { in: ['PENDING', 'PARTIAL'] }
          }
        },
        positions: {
          where: {
            closedAt: null
          }
        }
      }
    });

    if (!marketMaker) return null;

    const totalOrderValue = marketMaker.orders.reduce((sum, order) => 
      sum + (order.price * order.remainingQty), 0
    );

    const totalPositionValue = marketMaker.positions.reduce((sum, position) => 
      sum + (position.entryPrice * position.size), 0
    );

    return {
      balance: marketMaker.balance,
      activeOrders: marketMaker.orders.length,
      totalOrderValue,
      openPositions: marketMaker.positions.length,
      totalPositionValue
    };
  }
}

export default MarketMaker.getInstance(); 