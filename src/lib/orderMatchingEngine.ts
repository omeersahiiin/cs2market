import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaClientSingleton } from '@/lib/prisma';

const prisma = PrismaClientSingleton.getInstance();

/**
 * Round price to 2 decimal places to avoid floating-point precision issues
 */
function roundPrice(price: number): number {
  return Math.round(price * 100) / 100;
}

export interface OrderBookEntry {
  id: string;
  userId: string;
  price: number;
  quantity: number;
  remainingQty: number;
  createdAt: Date;
  side: 'BUY' | 'SELL';
  positionType: 'LONG' | 'SHORT';
}

export interface OrderBook {
  bids: OrderBookEntry[]; // Buy orders (sorted by price DESC, time ASC)
  asks: OrderBookEntry[]; // Sell orders (sorted by price ASC, time ASC)
}

export interface MatchResult {
  fills: Array<{
    buyOrderId: string;
    sellOrderId: string;
    price: number;
    quantity: number;
    buyUserId: string;
    sellUserId: string;
  }>;
  updatedOrders: Array<{
    orderId: string;
    newRemainingQty: number;
    status: 'PARTIAL' | 'FILLED' | 'OPEN';
  }>;
  marketPrice?: number;
}

export class OrderMatchingEngine {
  private skinId: string;

  constructor(skinId: string) {
    this.skinId = skinId;
  }

  /**
   * Get the current order book for the skin
   */
  async getOrderBook(excludeOrderId?: string): Promise<OrderBook> {
    const orders = await prisma.order.findMany({
      where: {
        skinId: this.skinId,
        status: { in: ['OPEN', 'PARTIAL'] },
        remainingQty: { gt: 0 },
        ...(excludeOrderId && { id: { not: excludeOrderId } })
      },
      orderBy: [
        { price: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    const bids = orders
      .filter((order: any) => order.side === 'BUY')
      .sort((a: any, b: any) => {
        // Sort by price DESC (highest first), then by time ASC (earliest first)
        if (a.price !== b.price) return b.price - a.price;
        return a.createdAt.getTime() - b.createdAt.getTime();
      })
      .map((order: any) => ({
        id: order.id,
        userId: order.userId,
        price: order.price,
        quantity: order.quantity,
        remainingQty: order.remainingQty,
        createdAt: order.createdAt,
        side: order.side as 'BUY' | 'SELL',
        positionType: order.positionType as 'LONG' | 'SHORT'
      }));

    const asks = orders
      .filter((order: any) => order.side === 'SELL')
      .sort((a: any, b: any) => {
        // Sort by price ASC (lowest first), then by time ASC (earliest first)
        if (a.price !== b.price) return a.price - b.price;
        return a.createdAt.getTime() - b.createdAt.getTime();
      })
      .map((order: any) => ({
        id: order.id,
        userId: order.userId,
        price: order.price,
        quantity: order.quantity,
        remainingQty: order.remainingQty,
        createdAt: order.createdAt,
        side: order.side as 'BUY' | 'SELL',
        positionType: order.positionType as 'LONG' | 'SHORT'
      }));

    return { bids, asks };
  }

  /**
   * Get the best bid and ask prices
   */
  async getBestPrices(): Promise<{ bestBid?: number; bestAsk?: number; spread?: number }> {
    const orderBook = await this.getOrderBook();
    
    const bestBid = orderBook.bids.length > 0 ? orderBook.bids[0].price : undefined;
    const bestAsk = orderBook.asks.length > 0 ? orderBook.asks[0].price : undefined;
    
    const spread = bestBid && bestAsk ? bestAsk - bestBid : undefined;
    
    return { bestBid, bestAsk, spread };
  }

  /**
   * Calculate the current market price based on order book
   */
  async getMarketPrice(): Promise<number> {
    const { bestBid, bestAsk } = await this.getBestPrices();
    
    // If we have both bid and ask, use the midpoint
    if (bestBid && bestAsk) {
      const midpoint = (bestBid + bestAsk) / 2;
      return roundPrice(midpoint);
    }
    
    // If only bid, use bid price
    if (bestBid) return roundPrice(bestBid);
    
    // If only ask, use ask price
    if (bestAsk) return roundPrice(bestAsk);
    
    // Fallback to current skin price from database
    const skin = await prisma.skin.findUnique({
      where: { id: this.skinId }
    });
    
    return roundPrice(skin?.price || 0);
  }

  /**
   * Place a new order and attempt to match it
   */
  async placeOrder(order: {
    userId: string;
    side: 'BUY' | 'SELL';
    orderType: 'MARKET' | 'LIMIT';
    positionType: 'LONG' | 'SHORT';
    price?: number;
    quantity: number;
    timeInForce?: string;
  }): Promise<{ orderId: string; matchResult: MatchResult }> {
    
    let orderPrice = order.price;
    
    // For market orders, we need to handle them differently
    if (order.orderType === 'MARKET') {
      // Market orders should execute immediately at the best available price
      const { bestBid, bestAsk } = await this.getBestPrices();
      
      if (order.side === 'BUY') {
        // BUY market order should take the best ask (lowest sell price)
        if (!bestAsk) {
          throw new Error('No liquidity available for market buy order');
        }
        // Use a price slightly above best ask to ensure immediate execution
        orderPrice = roundPrice(bestAsk + 0.01);
      } else {
        // SELL market order should take the best bid (highest buy price)
        if (!bestBid) {
          throw new Error('No liquidity available for market sell order');
        }
        // Use a price slightly below best bid to ensure immediate execution
        orderPrice = roundPrice(bestBid - 0.01);
      }
    }

    if (!orderPrice || orderPrice <= 0) {
      throw new Error('Invalid order price');
    }

    // Round the price to avoid floating-point precision issues
    orderPrice = roundPrice(orderPrice);

    // Create the order in database
    const newOrder = await prisma.order.create({
      data: {
        userId: order.userId,
        skinId: this.skinId,
        side: order.side,
        orderType: order.orderType,
        positionType: order.positionType,
        price: orderPrice,
        quantity: order.quantity,
        remainingQty: order.quantity,
        status: 'PENDING',
        timeInForce: order.timeInForce || 'GTC'
      }
    });

    // Attempt to match the order
    const matchResult = await this.matchOrder(newOrder.id);

    // For market orders, if they don't fill completely, cancel the remaining quantity
    if (order.orderType === 'MARKET' && matchResult.fills.length > 0) {
      const totalFilled = matchResult.fills
        .filter((fill: any) => fill.buyOrderId === newOrder.id || fill.sellOrderId === newOrder.id)
        .reduce((sum: number, fill: any) => sum + fill.quantity, 0);
      
      if (totalFilled < order.quantity) {
        // Cancel the unfilled portion of the market order
        await this.cancelOrder(newOrder.id, order.userId);
      }
    }

    return { orderId: newOrder.id, matchResult };
  }

  /**
   * Match a specific order against the order book
   */
  async matchOrder(orderId: string): Promise<MatchResult> {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order || order.remainingQty <= 0) {
      return { fills: [], updatedOrders: [] };
    }

    const orderBook = await this.getOrderBook(orderId);
    const fills: MatchResult['fills'] = [];
    const updatedOrders: MatchResult['updatedOrders'] = [];

    let remainingQty = order.remainingQty;
    
    // Get the opposite side of the order book
    const oppositeOrders = order.side === 'BUY' ? orderBook.asks : orderBook.bids;

    for (const bookOrder of oppositeOrders) {
      if (remainingQty <= 0) break;

      // Prevent self-matching - users cannot match their own orders
      if (order.userId === bookOrder.userId) {
        continue; // Skip this order and check the next one
      }

      // Check if prices can match (with floating point tolerance)
      const tolerance = 0.001; // $0.001 tolerance for floating point precision
      const canMatch = order.side === 'BUY' 
        ? order.price >= (bookOrder.price - tolerance)  // Buy order price >= sell order price (with tolerance)
        : order.price <= (bookOrder.price + tolerance); // Sell order price <= buy order price (with tolerance)

      if (!canMatch) break; // No more matches possible due to price priority

      // Calculate fill quantity
      const fillQty = Math.min(remainingQty, bookOrder.remainingQty);
      
      // Use the book order's price (price-time priority)
      const fillPrice = bookOrder.price;

      // Create fill record
      fills.push({
        buyOrderId: order.side === 'BUY' ? order.id : bookOrder.id,
        sellOrderId: order.side === 'SELL' ? order.id : bookOrder.id,
        price: fillPrice,
        quantity: fillQty,
        buyUserId: order.side === 'BUY' ? order.userId : bookOrder.userId,
        sellUserId: order.side === 'SELL' ? order.userId : bookOrder.userId
      });

      // Update remaining quantities
      remainingQty -= fillQty;
      const newBookOrderRemainingQty = bookOrder.remainingQty - fillQty;

      // Track order updates
      updatedOrders.push({
        orderId: bookOrder.id,
        newRemainingQty: newBookOrderRemainingQty,
        status: newBookOrderRemainingQty === 0 ? 'FILLED' : 'PARTIAL'
      });
    }

    // Update the incoming order
    const newOrderStatus = remainingQty === 0 ? 'FILLED' : 
                          remainingQty < order.quantity ? 'PARTIAL' : 'OPEN';
    
    updatedOrders.push({
      orderId: order.id,
      newRemainingQty: remainingQty,
      status: newOrderStatus as 'PARTIAL' | 'FILLED' | 'OPEN'
    });

    // Execute all updates in a transaction
    await this.executeFills(fills, updatedOrders);

    // Calculate new market price if there were fills
    const marketPrice = fills.length > 0 ? fills[fills.length - 1].price : undefined;

    return { fills, updatedOrders, marketPrice };
  }

  /**
   * Execute fills and update orders in the database
   */
  private async executeFills(fills: MatchResult['fills'], updatedOrders: MatchResult['updatedOrders']) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create fill records
      for (const fill of fills) {
        await tx.orderFill.create({
          data: {
            orderId: fill.buyOrderId,
            price: fill.price,
            quantity: fill.quantity
          }
        });

        await tx.orderFill.create({
          data: {
            orderId: fill.sellOrderId,
            price: fill.price,
            quantity: fill.quantity
          }
        });
      }

      // Update orders
      for (const update of updatedOrders) {
        await tx.order.update({
          where: { id: update.orderId },
          data: {
            remainingQty: update.newRemainingQty,
            filledQty: {
              increment: fills
                .filter((f: any) => f.buyOrderId === update.orderId || f.sellOrderId === update.orderId)
                .reduce((sum: number, f: any) => sum + f.quantity, 0)
            },
            status: update.status,
            filledAt: update.status === 'FILLED' ? new Date() : undefined
          }
        });
      }

      // Update skin price if there were fills
      if (fills.length > 0) {
        const lastFillPrice = fills[fills.length - 1].price;
        await tx.skin.update({
          where: { id: this.skinId },
          data: { price: lastFillPrice }
        });
      }
    });
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, userId: string): Promise<boolean> {
    try {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: userId,
          status: { in: ['PENDING', 'PARTIAL', 'OPEN'] }
        }
      });

      if (!order) {
        return false;
      }

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Error cancelling order:', error);
      return false;
    }
  }

  /**
   * Get order book depth (aggregated by price level)
   */
  async getOrderBookDepth(levels: number = 10): Promise<{
    bids: Array<{ price: number; quantity: number; orders: number }>;
    asks: Array<{ price: number; quantity: number; orders: number }>;
  }> {
    const orderBook = await this.getOrderBook();

    // Aggregate bids by price level
    const bidMap = new Map<number, { quantity: number; orders: number }>();
    orderBook.bids.forEach(order => {
      const existing = bidMap.get(order.price) || { quantity: 0, orders: 0 };
      bidMap.set(order.price, {
        quantity: existing.quantity + order.remainingQty,
        orders: existing.orders + 1
      });
    });

    // Aggregate asks by price level
    const askMap = new Map<number, { quantity: number; orders: number }>();
    orderBook.asks.forEach(order => {
      const existing = askMap.get(order.price) || { quantity: 0, orders: 0 };
      askMap.set(order.price, {
        quantity: existing.quantity + order.remainingQty,
        orders: existing.orders + 1
      });
    });

    // Convert to arrays and limit to specified levels
    const bids = Array.from(bidMap.entries())
      .map(([price, data]: any) => ({ price, ...data }))
      .sort((a: any, b: any) => b.price - a.price) // Highest price first
      .slice(0, levels);

    const asks = Array.from(askMap.entries())
      .map(([price, data]: any) => ({ price, ...data }))
      .sort((a: any, b: any) => a.price - b.price) // Lowest price first
      .slice(0, levels);

    return { bids, asks };
  }
}

export default OrderMatchingEngine; 