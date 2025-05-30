const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testShortMatching() {
  try {
    console.log('=== Testing SHORT Position Order Matching ===');
    
    // Get current order book for AK-47 Redline
    const skinId = 'cmb5otztl0001tekka6mua3r1';
    
    const orders = await prisma.order.findMany({
      where: {
        skinId: skinId,
        status: { in: ['PENDING', 'PARTIAL'] },
        remainingQty: { gt: 0 }
      },
      include: {
        user: {
          select: { email: true }
        }
      },
      orderBy: [
        { price: 'asc' },
        { createdAt: 'asc' }
      ]
    });
    
    console.log('\n=== Current Order Book Analysis ===');
    console.log('Total orders:', orders.length);
    
    // Group by side and position type
    const ordersByType = {
      'BUY_LONG': [],
      'BUY_SHORT': [],
      'SELL_LONG': [],
      'SELL_SHORT': []
    };
    
    orders.forEach(order => {
      const key = `${order.side}_${order.positionType}`;
      ordersByType[key].push(order);
    });
    
    console.log('\n=== Order Distribution ===');
    Object.entries(ordersByType).forEach(([type, orders]) => {
      console.log(`${type}: ${orders.length} orders`);
      orders.slice(0, 3).forEach(order => {
        console.log(`  - $${order.price.toFixed(2)} x ${order.remainingQty} (${order.user.email.slice(0, 10)}...)`);
      });
    });
    
    console.log('\n=== Binance-Style Matching Logic ===');
    console.log('✅ BUY LONG orders should match with SELL SHORT orders (both want price to go UP)');
    console.log('✅ SELL LONG orders should match with BUY SHORT orders (both want price to go DOWN)');
    console.log('✅ BUY LONG vs SELL LONG = Opening vs Closing LONG positions');
    console.log('✅ BUY SHORT vs SELL SHORT = Opening vs Closing SHORT positions');
    
    // Test potential matches
    console.log('\n=== Potential Matches ===');
    
    // BUY LONG vs SELL SHORT (both bullish)
    const buyLong = ordersByType['BUY_LONG'].sort((a, b) => b.price - a.price);
    const sellShort = ordersByType['SELL_SHORT'].sort((a, b) => a.price - b.price);
    
    if (buyLong.length > 0 && sellShort.length > 0) {
      console.log('\n📈 BUY LONG vs SELL SHORT (Both Bullish):');
      const bestBuyLong = buyLong[0];
      const bestSellShort = sellShort[0];
      
      console.log(`  Best BUY LONG:  $${bestBuyLong.price.toFixed(2)} x ${bestBuyLong.remainingQty}`);
      console.log(`  Best SELL SHORT: $${bestSellShort.price.toFixed(2)} x ${bestSellShort.remainingQty}`);
      
      if (bestBuyLong.price >= bestSellShort.price) {
        console.log(`  ✅ MATCH POSSIBLE! Spread: $${(bestBuyLong.price - bestSellShort.price).toFixed(2)}`);
        console.log(`  📊 Trade would execute at: $${bestSellShort.price.toFixed(2)} (taker pays maker's price)`);
      } else {
        console.log(`  ❌ No match. Spread: $${(bestSellShort.price - bestBuyLong.price).toFixed(2)}`);
      }
    }
    
    // SELL LONG vs BUY SHORT (both bearish)
    const sellLong = ordersByType['SELL_LONG'].sort((a, b) => a.price - b.price);
    const buyShort = ordersByType['BUY_SHORT'].sort((a, b) => b.price - a.price);
    
    if (sellLong.length > 0 && buyShort.length > 0) {
      console.log('\n📉 SELL LONG vs BUY SHORT (Both Bearish):');
      const bestSellLong = sellLong[0];
      const bestBuyShort = buyShort[0];
      
      console.log(`  Best SELL LONG: $${bestSellLong.price.toFixed(2)} x ${bestSellLong.remainingQty}`);
      console.log(`  Best BUY SHORT:  $${bestBuyShort.price.toFixed(2)} x ${bestBuyShort.remainingQty}`);
      
      if (bestBuyShort.price >= bestSellLong.price) {
        console.log(`  ✅ MATCH POSSIBLE! Spread: $${(bestBuyShort.price - bestSellLong.price).toFixed(2)}`);
        console.log(`  📊 Trade would execute at: $${bestSellLong.price.toFixed(2)} (taker pays maker's price)`);
      } else {
        console.log(`  ❌ No match. Spread: $${(bestSellLong.price - bestBuyShort.price).toFixed(2)}`);
      }
    }
    
    console.log('\n=== Order Matching Engine Test ===');
    
    // Check if our order matching engine handles all combinations
    const OrderMatchingEngine = require('./src/lib/orderMatchingEngine.js').OrderMatchingEngine;
    const engine = new OrderMatchingEngine(skinId);
    
    const orderBook = await engine.getOrderBook();
    
    console.log('\nOrder Book from Engine:');
    console.log(`Bids: ${orderBook.bids.length} orders`);
    console.log(`Asks: ${orderBook.asks.length} orders`);
    
    // Show top 3 bids and asks with position types
    console.log('\nTop Bids (Buy Orders):');
    orderBook.bids.slice(0, 3).forEach((bid, i) => {
      console.log(`  ${i+1}. $${bid.price.toFixed(2)} x ${bid.remainingQty} (${bid.positionType})`);
    });
    
    console.log('\nTop Asks (Sell Orders):');
    orderBook.asks.slice(0, 3).forEach((ask, i) => {
      console.log(`  ${i+1}. $${ask.price.toFixed(2)} x ${ask.remainingQty} (${ask.positionType})`);
    });
    
    console.log('\n=== Conclusion ===');
    console.log('🔍 Check if SHORT positions are properly matching with LONG positions');
    console.log('🔍 Verify that position types are correctly handled in order matching');
    console.log('🔍 Ensure both opening and closing positions work for SHORT trades');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testShortMatching(); 