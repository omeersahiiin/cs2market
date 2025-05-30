import { PrismaClient } from '@prisma/client';
import { PriceOracle } from './priceOracle';

const prisma = new PrismaClient();

export interface FundingRateData {
  skinId: string;
  rate: number; // Annual percentage rate
  direction: 'LONG_PAYS' | 'SHORT_PAYS' | 'NEUTRAL';
  reason: string;
}

export class FundingRateManager {
  private static instance: FundingRateManager;
  private priceOracle: PriceOracle;

  constructor() {
    this.priceOracle = PriceOracle.getInstance();
  }

  public static getInstance(): FundingRateManager {
    if (!FundingRateManager.instance) {
      FundingRateManager.instance = new FundingRateManager();
    }
    return FundingRateManager.instance;
  }

  /**
   * Calculate funding rate based on price deviation
   */
  async calculateFundingRate(skinId: string): Promise<FundingRateData> {
    const convergenceData = await this.priceOracle.checkPriceConvergence(skinId);
    
    const deviationPercent = (convergenceData.deviation / convergenceData.externalPrice) * 100;
    
    let rate = 0;
    let direction: 'LONG_PAYS' | 'SHORT_PAYS' | 'NEUTRAL' = 'NEUTRAL';
    let reason = 'Price aligned with external markets';

    // Base funding rate calculation
    if (deviationPercent > 2) {
      // Scale funding rate based on deviation (max 50% annual)
      rate = Math.min(deviationPercent * 2, 50); // 2% deviation = 4% annual funding
      
      if (convergenceData.internalPrice > convergenceData.externalPrice) {
        // Internal price too high - charge longs to encourage selling
        direction = 'LONG_PAYS';
        reason = `Internal price ${deviationPercent.toFixed(2)}% above external market`;
      } else {
        // Internal price too low - charge shorts to encourage buying
        direction = 'SHORT_PAYS';
        reason = `Internal price ${deviationPercent.toFixed(2)}% below external market`;
      }
    }

    return {
      skinId,
      rate,
      direction,
      reason
    };
  }

  /**
   * Apply funding rate to all open positions for a skin
   */
  async applyFundingRate(skinId: string): Promise<void> {
    const fundingData = await this.calculateFundingRate(skinId);
    
    if (fundingData.direction === 'NEUTRAL') {
      return; // No funding to apply
    }

    // Get all open positions for this skin
    const positions = await prisma.position.findMany({
      where: {
        skinId,
        closedAt: null // Only open positions
      },
      include: {
        user: true
      }
    });

    if (positions.length === 0) return;

    // Calculate hourly funding rate (divide annual by 8760 hours)
    const hourlyRate = fundingData.rate / 8760 / 100; // Convert to decimal

    await prisma.$transaction(async (tx) => {
      for (const position of positions) {
        const shouldPayFunding = 
          (fundingData.direction === 'LONG_PAYS' && position.type === 'LONG') ||
          (fundingData.direction === 'SHORT_PAYS' && position.type === 'SHORT');

        if (shouldPayFunding) {
          // Calculate funding payment based on position size
          const positionValue = position.entryPrice * position.size;
          const fundingPayment = positionValue * hourlyRate;

          // Deduct funding from user balance
          await tx.user.update({
            where: { id: position.userId },
            data: {
              balance: {
                decrement: fundingPayment
              }
            }
          });

          // Log funding payment (you might want to create a FundingPayment model)
          console.log(`Funding payment: ${position.user.email} paid $${fundingPayment.toFixed(4)} for ${position.type} position`);
        }
      }
    });

    console.log(`Applied funding rate: ${fundingData.rate.toFixed(2)}% annual (${fundingData.direction}) - ${fundingData.reason}`);
  }

  /**
   * Get current funding rate for display
   */
  async getCurrentFundingRate(skinId: string): Promise<FundingRateData> {
    return this.calculateFundingRate(skinId);
  }

  /**
   * Schedule funding rate application (call this every hour)
   */
  async scheduleFundingRates(): Promise<void> {
    const skins = await prisma.skin.findMany();
    
    for (const skin of skins) {
      try {
        await this.applyFundingRate(skin.id);
      } catch (error) {
        console.error(`Error applying funding rate for ${skin.name}:`, error);
      }
    }
  }
} 