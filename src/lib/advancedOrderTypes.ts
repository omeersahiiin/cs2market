import { PrismaClient } from '@prisma/client';
import { OrderMatchingEngine } from './orderMatchingEngine';

const prisma = new PrismaClient();

interface ConditionalOrder {
  id: string;
  userId: string;
  skinId: string;
  orderType: 'STOP_LOSS' | 'TAKE_PROFIT' | 'STOP_LIMIT';
  triggerPrice: number;
  limitPrice?: number; // For stop-limit orders
  side: 'BUY' | 'SELL';
  positionType: 'LONG' | 'SHORT';
  quantity: number;
  status: 'PENDING' | 'TRIGGERED' | 'FILLED' | 'CANCELLED';
  linkedPositionId?: string; // For position-linked orders
  createdAt: Date;
  triggeredAt?: Date;
  filledAt?: Date;
}

interface TriggerResult {
  orderId: string;
  triggered: boolean;
  marketOrderId?: string;
  reason: string;
}

export class AdvancedOrderManager {
  private static instance: AdvancedOrderManager;
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  private constructor() {}
  
  public static getInstance(): AdvancedOrderManager {
    if (!AdvancedOrderManager.instance) {
      AdvancedOrderManager.instance = new AdvancedOrderManager();
    }
    return AdvancedOrderManager.instance;
  }

  /**
   * Create a stop-loss order
   */
  async createStopLoss(params: {
    userId: string;
    skinId: string;
    positionId: string;
    triggerPrice: number;
    quantity: number;
  }): Promise<string> {
    // Get the position to determine order side
    const position = await prisma.position.findUnique({
      where: { id: params.positionId }
    });

    if (!position) {
      throw new Error('Position not found');
    }

    // Stop-loss for LONG position = SELL order
    // Stop-loss for SHORT position = BUY order
    const side = position.type === 'LONG' ? 'SELL' : 'BUY';
    const positionType = position.type === 'LONG' ? 'SHORT' : 'LONG';

    // Validate trigger price
    if (position.type === 'LONG' && params.triggerPrice >= position.entryPrice) {
      throw new Error('Stop-loss trigger price must be below entry price for LONG positions');
    }
    if (position.type === 'SHORT' && params.triggerPrice <= position.entryPrice) {
      throw new Error('Stop-loss trigger price must be above entry price for SHORT positions');
    }

    const order = await prisma.conditionalOrder.create({
      data: {
        userId: params.userId,
        skinId: params.skinId,
        orderType: 'STOP_LOSS',
        triggerPrice: params.triggerPrice,
        side,
        positionType,
        quantity: params.quantity,
        status: 'PENDING',
        linkedPositionId: params.positionId
      }
    });

    console.log(`📉 Stop-Loss created: ${side} ${params.quantity} @ trigger $${params.triggerPrice}`);
    return order.id;
  }

  /**
   * Create a take-profit order
   */
  async createTakeProfit(params: {
    userId: string;
    skinId: string;
    positionId: string;
    triggerPrice: number;
    quantity: number;
  }): Promise<string> {
    // Get the position to determine order side
    const position = await prisma.position.findUnique({
      where: { id: params.positionId }
    });

    if (!position) {
      throw new Error('Position not found');
    }

    // Take-profit for LONG position = SELL order
    // Take-profit for SHORT position = BUY order
    const side = position.type === 'LONG' ? 'SELL' : 'BUY';
    const positionType = position.type === 'LONG' ? 'SHORT' : 'LONG';

    // Validate trigger price
    if (position.type === 'LONG' && params.triggerPrice <= position.entryPrice) {
      throw new Error('Take-profit trigger price must be above entry price for LONG positions');
    }
    if (position.type === 'SHORT' && params.triggerPrice >= position.entryPrice) {
      throw new Error('Take-profit trigger price must be below entry price for SHORT positions');
    }

    const order = await prisma.conditionalOrder.create({
      data: {
        userId: params.userId,
        skinId: params.skinId,
        orderType: 'TAKE_PROFIT',
        triggerPrice: params.triggerPrice,
        side,
        positionType,
        quantity: params.quantity,
        status: 'PENDING',
        linkedPositionId: params.positionId
      }
    });

    console.log(`📈 Take-Profit created: ${side} ${params.quantity} @ trigger $${params.triggerPrice}`);
    return order.id;
  }

  /**
   * Create a stop-limit order
   */
  async createStopLimit(params: {
    userId: string;
    skinId: string;
    triggerPrice: number;
    limitPrice: number;
    side: 'BUY' | 'SELL';
    positionType: 'LONG' | 'SHORT';
    quantity: number;
  }): Promise<string> {
    // Validate prices
    if (params.side === 'BUY' && params.limitPrice < params.triggerPrice) {
      throw new Error('For BUY stop-limit, limit price must be >= trigger price');
    }
    if (params.side === 'SELL' && params.limitPrice > params.triggerPrice) {
      throw new Error('For SELL stop-limit, limit price must be <= trigger price');
    }

    const order = await prisma.conditionalOrder.create({
      data: {
        userId: params.userId,
        skinId: params.skinId,
        orderType: 'STOP_LIMIT',
        triggerPrice: params.triggerPrice,
        limitPrice: params.limitPrice,
        side: params.side,
        positionType: params.positionType,
        quantity: params.quantity,
        status: 'PENDING'
      }
    });

    console.log(`🎯 Stop-Limit created: ${params.side} ${params.quantity} @ trigger $${params.triggerPrice}, limit $${params.limitPrice}`);
    return order.id;
  }

  /**
   * Monitor and trigger conditional orders
   */
  async checkTriggers(): Promise<TriggerResult[]> {
    const pendingOrders = await prisma.conditionalOrder.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        skin: true
      }
    });

    const results: TriggerResult[] = [];

    for (const order of pendingOrders) {
      const currentPrice = order.skin.price;
      let shouldTrigger = false;
      let reason = '';

      // Check trigger conditions
      switch (order.orderType) {
        case 'STOP_LOSS':
          if (order.side === 'SELL' && currentPrice <= order.triggerPrice) {
            shouldTrigger = true;
            reason = `Stop-loss triggered: price ${currentPrice} <= trigger ${order.triggerPrice}`;
          } else if (order.side === 'BUY' && currentPrice >= order.triggerPrice) {
            shouldTrigger = true;
            reason = `Stop-loss triggered: price ${currentPrice} >= trigger ${order.triggerPrice}`;
          }
          break;

        case 'TAKE_PROFIT':
          if (order.side === 'SELL' && currentPrice >= order.triggerPrice) {
            shouldTrigger = true;
            reason = `Take-profit triggered: price ${currentPrice} >= trigger ${order.triggerPrice}`;
          } else if (order.side === 'BUY' && currentPrice <= order.triggerPrice) {
            shouldTrigger = true;
            reason = `Take-profit triggered: price ${currentPrice} <= trigger ${order.triggerPrice}`;
          }
          break;

        case 'STOP_LIMIT':
          if (order.side === 'BUY' && currentPrice >= order.triggerPrice) {
            shouldTrigger = true;
            reason = `Stop-limit triggered: price ${currentPrice} >= trigger ${order.triggerPrice}`;
          } else if (order.side === 'SELL' && currentPrice <= order.triggerPrice) {
            shouldTrigger = true;
            reason = `Stop-limit triggered: price ${currentPrice} <= trigger ${order.triggerPrice}`;
          }
          break;
      }

      if (shouldTrigger) {
        try {
          const marketOrderId = await this.triggerOrder(order);
          results.push({
            orderId: order.id,
            triggered: true,
            marketOrderId,
            reason
          });
        } catch (error) {
          console.error(`Failed to trigger order ${order.id}:`, error);
          results.push({
            orderId: order.id,
            triggered: false,
            reason: `Trigger failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }
    }

    return results;
  }

  /**
   * Trigger a conditional order by placing a market/limit order
   */
  private async triggerOrder(order: {
    id: string;
    userId: string;
    skinId: string;
    orderType: string;
    triggerPrice: number;
    limitPrice?: number | null;
    side: string;
    positionType: string;
    quantity: number;
  }): Promise<string> {
    const engine = new OrderMatchingEngine(order.skinId);

    // Update conditional order status
    await prisma.conditionalOrder.update({
      where: { id: order.id },
      data: {
        status: 'TRIGGERED',
        triggeredAt: new Date()
      }
    });

    // Place the actual order
    let orderResult;
    
    if (order.orderType === 'STOP_LIMIT') {
      // Place limit order at the specified limit price
      orderResult = await engine.placeOrder({
        userId: order.userId,
        side: order.side as 'BUY' | 'SELL',
        orderType: 'LIMIT',
        positionType: order.positionType as 'LONG' | 'SHORT',
        price: order.limitPrice!,
        quantity: order.quantity,
        timeInForce: 'GTC'
      });
    } else {
      // Place market order for stop-loss and take-profit
      orderResult = await engine.placeOrder({
        userId: order.userId,
        side: order.side as 'BUY' | 'SELL',
        orderType: 'MARKET',
        positionType: order.positionType as 'LONG' | 'SHORT',
        quantity: order.quantity,
        timeInForce: 'IOC'
      });
    }

    // If order was filled, update conditional order status
    if (orderResult.matchResult.fills.length > 0) {
      await prisma.conditionalOrder.update({
        where: { id: order.id },
        data: {
          status: 'FILLED',
          filledAt: new Date()
        }
      });
    }

    console.log(`⚡ Triggered ${order.orderType}: ${order.side} ${order.quantity} @ $${order.triggerPrice}`);
    return orderResult.orderId;
  }

  /**
   * Cancel a conditional order
   */
  async cancelConditionalOrder(orderId: string, userId: string): Promise<boolean> {
    try {
      const order = await prisma.conditionalOrder.findFirst({
        where: {
          id: orderId,
          userId: userId,
          status: 'PENDING'
        }
      });

      if (!order) {
        return false;
      }

      await prisma.conditionalOrder.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED'
        }
      });

      console.log(`❌ Cancelled conditional order: ${order.orderType} ${order.side} ${order.quantity}`);
      return true;
    } catch (error) {
      console.error('Error cancelling conditional order:', error);
      return false;
    }
  }

  /**
   * Get user's conditional orders
   */
  async getUserConditionalOrders(userId: string, skinId?: string): Promise<ConditionalOrder[]> {
    const orders = await prisma.conditionalOrder.findMany({
      where: {
        userId,
        ...(skinId && { skinId }),
        status: { in: ['PENDING', 'TRIGGERED'] }
      },
      include: {
        skin: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return orders.map((order: any) => ({
      id: order.id,
      userId: order.userId,
      skinId: order.skinId,
      orderType: order.orderType as 'STOP_LOSS' | 'TAKE_PROFIT' | 'STOP_LIMIT',
      triggerPrice: order.triggerPrice,
      limitPrice: order.limitPrice || undefined,
      side: order.side as 'BUY' | 'SELL',
      positionType: order.positionType as 'LONG' | 'SHORT',
      quantity: order.quantity,
      status: order.status as 'PENDING' | 'TRIGGERED' | 'FILLED' | 'CANCELLED',
      linkedPositionId: order.linkedPositionId || undefined,
      createdAt: order.createdAt,
      triggeredAt: order.triggeredAt || undefined,
      filledAt: order.filledAt || undefined
    }));
  }

  /**
   * Start monitoring conditional orders
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    console.log('🎯 Starting conditional order monitoring...');
    
    this.monitoringInterval = setInterval(async () => {
      try {
        const results = await this.checkTriggers();
        
        if (results.length > 0) {
          const triggered = results.filter(r => r.triggered).length;
          console.log(`⚡ Processed ${triggered}/${results.length} conditional order triggers`);
        }
      } catch (error) {
        console.error('Error in conditional order monitoring:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop monitoring conditional orders
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 Stopped conditional order monitoring');
    }
  }
} 