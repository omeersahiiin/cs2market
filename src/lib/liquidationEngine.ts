import { PrismaClient, Prisma } from '@prisma/client';
import { OrderMatchingEngine } from './orderMatchingEngine';

const prisma = new PrismaClient();

interface LiquidationResult {
  positionId: string;
  userId: string;
  skinId: string;
  liquidationPrice: number;
  liquidationValue: number;
  remainingBalance: number;
  success: boolean;
  reason: string;
}

interface RiskMetrics {
  positionId: string;
  userId: string;
  skinId: string;
  skinName: string;
  positionType: string;
  entryPrice: number;
  currentPrice: number;
  size: number;
  margin: number;
  unrealizedPnL: number;
  marginRatio: number;
  liquidationPrice: number;
  riskLevel: 'SAFE' | 'WARNING' | 'DANGER' | 'LIQUIDATION';
}

export class LiquidationEngine {
  private static instance: LiquidationEngine;
  
  // Risk thresholds
  private readonly MAINTENANCE_MARGIN_RATIO = 0.1; // 10% - liquidation threshold
  private readonly WARNING_MARGIN_RATIO = 0.15; // 15% - warning level
  private readonly DANGER_MARGIN_RATIO = 0.12; // 12% - danger level
  
  private constructor() {}
  
  public static getInstance(): LiquidationEngine {
    if (!LiquidationEngine.instance) {
      LiquidationEngine.instance = new LiquidationEngine();
    }
    return LiquidationEngine.instance;
  }

  /**
   * Monitor all open positions and identify those at risk
   */
  async monitorPositions(): Promise<RiskMetrics[]> {
    const openPositions = await prisma.position.findMany({
      where: {
        closedAt: null
      },
      include: {
        skin: true,
        user: true
      }
    });

    const riskMetrics: RiskMetrics[] = [];

    for (const position of openPositions) {
      const currentPrice = position.skin.price;
      
      // Calculate unrealized P&L
      const unrealizedPnL = position.type === 'LONG'
        ? (currentPrice - position.entryPrice) * position.size
        : (position.entryPrice - currentPrice) * position.size;

      // Calculate current margin ratio
      const positionValue = currentPrice * position.size;
      const equity = position.margin + unrealizedPnL;
      const marginRatio = equity / positionValue;

      // Calculate liquidation price
      const liquidationPrice = this.calculateLiquidationPrice(
        position.entryPrice,
        position.margin,
        position.size,
        position.type as 'LONG' | 'SHORT'
      );

      // Determine risk level
      let riskLevel: RiskMetrics['riskLevel'] = 'SAFE';
      if (marginRatio <= this.MAINTENANCE_MARGIN_RATIO) {
        riskLevel = 'LIQUIDATION';
      } else if (marginRatio <= this.DANGER_MARGIN_RATIO) {
        riskLevel = 'DANGER';
      } else if (marginRatio <= this.WARNING_MARGIN_RATIO) {
        riskLevel = 'WARNING';
      }

      riskMetrics.push({
        positionId: position.id,
        userId: position.userId,
        skinId: position.skinId,
        skinName: position.skin.name,
        positionType: position.type,
        entryPrice: position.entryPrice,
        currentPrice,
        size: position.size,
        margin: position.margin,
        unrealizedPnL,
        marginRatio,
        liquidationPrice,
        riskLevel
      });
    }

    return riskMetrics;
  }

  /**
   * Calculate the liquidation price for a position
   */
  private calculateLiquidationPrice(
    entryPrice: number,
    margin: number,
    size: number,
    type: 'LONG' | 'SHORT'
  ): number {
    // Liquidation occurs when equity = maintenance margin
    // For LONG: liquidationPrice = entryPrice - (margin - maintenanceMargin) / size
    // For SHORT: liquidationPrice = entryPrice + (margin - maintenanceMargin) / size
    
    const maintenanceMargin = margin * this.MAINTENANCE_MARGIN_RATIO / 0.2; // Convert to absolute value
    const marginBuffer = margin - maintenanceMargin;
    
    if (type === 'LONG') {
      return entryPrice - (marginBuffer / size);
    } else {
      return entryPrice + (marginBuffer / size);
    }
  }

  /**
   * Liquidate positions that have breached maintenance margin
   */
  async liquidatePositions(): Promise<LiquidationResult[]> {
    const riskMetrics = await this.monitorPositions();
    const liquidationResults: LiquidationResult[] = [];

    const positionsToLiquidate = riskMetrics.filter(
      metrics => metrics.riskLevel === 'LIQUIDATION'
    );

    for (const metrics of positionsToLiquidate) {
      try {
        const result = await this.liquidatePosition(metrics);
        liquidationResults.push(result);
      } catch (error) {
        console.error(`Failed to liquidate position ${metrics.positionId}:`, error);
        liquidationResults.push({
          positionId: metrics.positionId,
          userId: metrics.userId,
          skinId: metrics.skinId,
          liquidationPrice: metrics.currentPrice,
          liquidationValue: 0,
          remainingBalance: 0,
          success: false,
          reason: `Liquidation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    return liquidationResults;
  }

  /**
   * Liquidate a specific position
   */
  private async liquidatePosition(metrics: RiskMetrics): Promise<LiquidationResult> {
    const position = await prisma.position.findUnique({
      where: { id: metrics.positionId },
      include: { user: true, skin: true }
    });

    if (!position || position.closedAt) {
      throw new Error('Position not found or already closed');
    }

    // Determine liquidation side (opposite of position)
    const liquidationSide = position.type === 'LONG' ? 'SELL' : 'BUY';
    
    // Initialize order matching engine
    const engine = new OrderMatchingEngine(position.skinId);

    // Execute market liquidation
    const liquidationResult = await engine.placeOrder({
      userId: 'LIQUIDATION_ENGINE', // Special system user
      side: liquidationSide as 'BUY' | 'SELL',
      orderType: 'MARKET',
      positionType: position.type === 'LONG' ? 'SHORT' : 'LONG',
      quantity: position.size,
      timeInForce: 'IOC' // Immediate or Cancel
    });

    let liquidationPrice = metrics.currentPrice;
    let liquidationValue = 0;
    let remainingBalance = 0;

    if (liquidationResult.matchResult.fills.length > 0) {
      // Calculate average liquidation price
      const totalValue = liquidationResult.matchResult.fills.reduce(
        (sum, fill) => sum + (fill.price * fill.quantity), 0
      );
      const totalQuantity = liquidationResult.matchResult.fills.reduce(
        (sum, fill) => sum + fill.quantity, 0
      );
      
      liquidationPrice = totalValue / totalQuantity;
      liquidationValue = totalValue;

      // Calculate final P&L
      const pnl = position.type === 'LONG'
        ? (liquidationPrice - position.entryPrice) * position.size
        : (position.entryPrice - liquidationPrice) * position.size;

      // Calculate remaining balance after liquidation
      remainingBalance = Math.max(0, position.margin + pnl);

      // Update position and user balance
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Close the position
        await tx.position.update({
          where: { id: position.id },
          data: {
            exitPrice: liquidationPrice,
            closedAt: new Date()
          }
        });

        // Update user balance with remaining equity (if any)
        if (remainingBalance > 0) {
          await tx.user.update({
            where: { id: position.userId },
            data: {
              balance: {
                increment: remainingBalance
              }
            }
          });
        }

        // Log liquidation event in console (could be stored in a separate logging system)
        console.log(`📊 LIQUIDATION EVENT: Position ${position.id} liquidated at $${liquidationPrice.toFixed(2)}, remaining balance: $${remainingBalance.toFixed(2)}`);
      });

      console.log(`🔴 LIQUIDATED: ${position.user.email} - ${position.type} ${position.size} ${position.skin.name} @ $${liquidationPrice.toFixed(2)}`);
    }

    return {
      positionId: position.id,
      userId: position.userId,
      skinId: position.skinId,
      liquidationPrice,
      liquidationValue,
      remainingBalance,
      success: liquidationResult.matchResult.fills.length > 0,
      reason: liquidationResult.matchResult.fills.length > 0 
        ? 'Successfully liquidated' 
        : 'No liquidity available for liquidation'
    };
  }

  /**
   * Send risk warnings to users
   */
  async sendRiskWarnings(): Promise<void> {
    const riskMetrics = await this.monitorPositions();
    
    const warningPositions = riskMetrics.filter(
      metrics => metrics.riskLevel === 'WARNING' || metrics.riskLevel === 'DANGER'
    );

    for (const metrics of warningPositions) {
      // In a real system, you would send email/SMS/push notifications
      console.log(`⚠️  RISK WARNING: User ${metrics.userId} - ${metrics.riskLevel} level for ${metrics.skinName}`);
      console.log(`   Margin Ratio: ${(metrics.marginRatio * 100).toFixed(2)}%`);
      console.log(`   Liquidation Price: $${metrics.liquidationPrice.toFixed(2)}`);
      console.log(`   Current Price: $${metrics.currentPrice.toFixed(2)}`);
    }
  }

  /**
   * Get risk summary for monitoring dashboard
   */
  async getRiskSummary(): Promise<{
    totalPositions: number;
    safePositions: number;
    warningPositions: number;
    dangerPositions: number;
    liquidationPositions: number;
    totalMarginAtRisk: number;
  }> {
    const riskMetrics = await this.monitorPositions();
    
    const summary = {
      totalPositions: riskMetrics.length,
      safePositions: riskMetrics.filter(m => m.riskLevel === 'SAFE').length,
      warningPositions: riskMetrics.filter(m => m.riskLevel === 'WARNING').length,
      dangerPositions: riskMetrics.filter(m => m.riskLevel === 'DANGER').length,
      liquidationPositions: riskMetrics.filter(m => m.riskLevel === 'LIQUIDATION').length,
      totalMarginAtRisk: riskMetrics
        .filter(m => m.riskLevel !== 'SAFE')
        .reduce((sum, m) => sum + m.margin, 0)
    };

    return summary;
  }

  /**
   * Start automated liquidation monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    console.log('🔍 Starting liquidation monitoring...');
    
    setInterval(async () => {
      try {
        // Check for liquidations
        const liquidationResults = await this.liquidatePositions();
        
        if (liquidationResults.length > 0) {
          console.log(`⚡ Processed ${liquidationResults.length} liquidations`);
        }

        // Send risk warnings
        await this.sendRiskWarnings();

      } catch (error) {
        console.error('Error in liquidation monitoring:', error);
      }
    }, intervalMs);
  }
} 