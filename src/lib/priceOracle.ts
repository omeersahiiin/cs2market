import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ExternalPriceData {
  source: string;
  price: number;
  timestamp: Date;
  volume?: number;
}

export interface PriceConvergenceData {
  skinId: string;
  externalPrice: number;
  internalPrice: number;
  deviation: number;
  convergenceActions: string[];
}

export class PriceOracle {
  private static instance: PriceOracle;

  public static getInstance(): PriceOracle {
    if (!PriceOracle.instance) {
      PriceOracle.instance = new PriceOracle();
    }
    return PriceOracle.instance;
  }

  /**
   * Fetch price from CSFloat API (example implementation)
   */
  async fetchCSFloatPrice(skinName: string): Promise<ExternalPriceData | null> {
    try {
      // This is a mock implementation - replace with actual CSFloat API
      // const response = await fetch(`https://csfloat.com/api/v1/market/${encodeURIComponent(skinName)}`);
      // const data = await response.json();
      
      // Mock data for demonstration
      const mockPrice = 85.50 + (Math.random() - 0.5) * 10; // Simulate price fluctuation
      
      return {
        source: 'CSFloat',
        price: mockPrice,
        timestamp: new Date(),
        volume: Math.floor(Math.random() * 1000) + 100
      };
    } catch (error) {
      console.error('Error fetching CSFloat price:', error);
      return null;
    }
  }

  /**
   * Fetch price from Steam Market API
   */
  async fetchSteamMarketPrice(skinName: string): Promise<ExternalPriceData | null> {
    try {
      // Mock implementation - replace with actual Steam Market API
      const mockPrice = 83.20 + (Math.random() - 0.5) * 8;
      
      return {
        source: 'Steam Market',
        price: mockPrice,
        timestamp: new Date(),
        volume: Math.floor(Math.random() * 500) + 50
      };
    } catch (error) {
      console.error('Error fetching Steam Market price:', error);
      return null;
    }
  }

  /**
   * Get aggregated external price from multiple sources
   */
  async getExternalPrice(skinName: string): Promise<number> {
    const sources = await Promise.allSettled([
      this.fetchCSFloatPrice(skinName),
      this.fetchSteamMarketPrice(skinName)
    ]);

    const validPrices: number[] = [];
    
    sources.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        validPrices.push(result.value.price);
      }
    });

    if (validPrices.length === 0) {
      throw new Error('No external price data available');
    }

    // Return weighted average (you can implement more sophisticated logic)
    return validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;
  }

  /**
   * Check price convergence and suggest actions
   */
  async checkPriceConvergence(skinId: string): Promise<PriceConvergenceData> {
    const skin = await prisma.skin.findUnique({
      where: { id: skinId }
    });

    if (!skin) {
      throw new Error('Skin not found');
    }

    const externalPrice = await this.getExternalPrice(skin.name);
    const internalPrice = skin.price;
    const deviation = Math.abs(externalPrice - internalPrice);
    const deviationPercent = (deviation / externalPrice) * 100;

    const convergenceActions: string[] = [];

    // If deviation is > 5%, suggest convergence actions
    if (deviationPercent > 5) {
      if (internalPrice > externalPrice) {
        convergenceActions.push('Internal price too high - encourage selling');
        convergenceActions.push('Reduce market maker ask prices');
        convergenceActions.push('Increase funding rate for longs');
      } else {
        convergenceActions.push('Internal price too low - encourage buying');
        convergenceActions.push('Reduce market maker bid prices');
        convergenceActions.push('Increase funding rate for shorts');
      }
    }

    return {
      skinId,
      externalPrice,
      internalPrice,
      deviation,
      convergenceActions
    };
  }

  /**
   * Update skin price based on external data (for reference)
   */
  async updateReferencePrice(skinId: string): Promise<void> {
    const skin = await prisma.skin.findUnique({
      where: { id: skinId }
    });

    if (!skin) return;

    try {
      const externalPrice = await this.getExternalPrice(skin.name);
      
      // Store as reference price (don't override market price)
      await prisma.skin.update({
        where: { id: skinId },
        data: {
          // You might want to add a referencePrice field to your schema
          updatedAt: new Date()
        }
      });

      console.log(`Updated reference price for ${skin.name}: $${externalPrice.toFixed(2)}`);
    } catch (error) {
      console.error('Error updating reference price:', error);
    }
  }
} 